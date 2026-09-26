const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const media = require('../client/scripts/common/media');
const { detailView, contactLinks } = require('../server/services/listingDetails');

function harness(query, axiosGet = async () => { throw new Error('Unexpected network request'); }) {
    const filename = path.resolve(__dirname, '../server/routes/MarketRoutes/marketRoutes.js');
    const routes = new Map(), queries = [];
    const noop = () => {};
    const router = Object.fromEntries(['get','post','put','delete'].map(method => [method, (url,...handlers) => routes.set(method+' '+url, handlers.at(-1))]));
    const client = { async query(sql, values = []) { queries.push({sql,values}); return {rows:await query(sql,values)}; } };
    const mocks = {express:{Router:()=>router}, multer:Object.assign(()=>({fields:()=>noop,single:()=>noop}),{diskStorage:()=>({})}), fs:{existsSync:()=>true}, axios:{get:axiosGet}, 'node-cron':{schedule:noop}, '../../config/db':client, '../../middleware/authMiddleware':{verifyToken:noop}, '../../middleware/MarketMiddleware/checkBlockStatusWithoutToken':noop, '../../middleware/MarketMiddleware/optionalAuth':noop, '../../utils/cliner/cliner.js':noop, '../../services/notifications':{create:async()=>{}}};
    const localRequire = createRequire(filename);
    vm.runInNewContext(fs.readFileSync(filename,'utf8'), { require:name=>Object.hasOwn(mocks,name)?mocks[name]:localRequire(name), module:{exports:{}}, __dirname:path.dirname(filename), console:{log:noop,error:noop,warn:noop}, URL, URLSearchParams, Buffer, process });
    return {queries,async call(key, body = {}, params = {listingId:'4'}) {
        const res = {statusCode:200,status(code){this.statusCode=code;return this;},json(data){this.body=data;return this;},set(){return this;},sendStatus(code){this.statusCode=code;return this;}};
        await routes.get(key)({user:{id:91},body,params,files:{}},res); return res;
    }};
}

test('custom user avatar paths and stored/remote covers resolve from nested pages', () => {
    assert.equal(media.avatarUrl('/market/uploads/avatars/custom/me.png'), '/market/uploads/avatars/custom/me.png');
    assert.equal(media.avatarUrl('../../uploads/me.png'), '/uploads/me.png');
    assert.equal(media.avatarUrl('../../images/account_circle_51dp.png'), media.fallbackAvatar);
    assert.equal(media.avatarUrl('javascript:alert(1)'), media.fallbackAvatar);
    assert.equal(media.coverUrl('https://yt3.ggpht.com/avatar.jpg'), 'https://yt3.ggpht.com/avatar.jpg');
    assert.equal(media.coverUrl('my cover.jpg'), '/market/uploads/my%20cover.jpg');
});
test('nested replies stay in their root conversation and preserve reply author', () => {
    const view = detailView({form_type:2,category_name:'Исполнитель',platform_slug:'youtube'}, [
        {id:1,parent_id:null,author_name:'A'}, {id:2,parent_id:1,author_name:'B'}, {id:3,parent_id:2,author_name:'C'}, {id:4,parent_id:null,author_name:'D'}
    ]);
    assert.deepEqual(view.threads.map(x=>x.id), [4,1]);
    assert.deepEqual(view.threads[1].replies.map(x=>x.id), [2,3]);
    assert.equal(view.threads[1].replies[1].replyingTo, 'B');
    assert.equal(view.catalogPath, '/market/youtube/become-executor');
    assert.equal(contactLinks({telegram:'https://t.me/test_user',whatsapp:'+7 (900) 123-45-67'})[0].href, 'https://t.me/test_user');
    assert.equal(contactLinks({telegram:'javascript:alert(1)'}).length, 0);
});
test('comments disabled by seller reject submissions before writing', async () => {
    const app = harness(sql => { if(sql.includes('l.allow_comments')) return [{allow_comments:false}]; throw new Error(sql); });
    const res = await app.call('post /add/comments',{listingId:4,message:'Question'});
    assert.equal(res.statusCode,403);
    assert.ok(!app.queries.some(x=>x.sql.includes('INSERT')));
});
test('reply must reference a comment belonging to the same listing', async () => {
    const app = harness((sql,values) => {
        if(sql.includes('l.allow_comments')) return [{allow_comments:true}];
        if(sql.startsWith('SELECT id FROM comments_listings')) { assert.deepEqual(Array.from(values),[900,4]); return []; }
        throw new Error(sql);
    });
    assert.equal((await app.call('post /add/comments',{listingId:4,parentId:900,message:'Question'})).statusCode,400);
});
test('reply is saved with parent id and returned with author and avatar', async () => {
    const app = harness((sql,values) => {
        if(sql.includes('l.allow_comments')) return [{allow_comments:true}];
        if(sql.startsWith('SELECT id FROM comments_listings')) return [{id:3}];
        if(sql.includes('COUNT(*)')) return [{count:0}];
        if(sql.includes('SELECT message')) return [];
        if(sql.includes('INSERT INTO comments_listings')) {assert.deepEqual(Array.from(values),[4,91,'Hello',3]);return [{id:5,message:'Hello',parent_id:3,created_at:new Date()}];}
        if(sql.startsWith('SELECT user_id, name')) return [{user_id:91,name:'Test'}];
        if(sql.includes('nickname AS author_name')) return [{author_name:'Test',author_avatar:'/market/uploads/avatars/custom/me.png'}];
        throw new Error(sql);
    });
    const res = await app.call('post /add/comments',{listingId:4,parentId:3,message:' Hello '});
    assert.equal(res.statusCode,201); assert.equal(res.body.comment.parent_id,3); assert.equal(res.body.comment.author_name,'Test');
});
test('editing description keeps category, channel link, images and paid placement untouched', async () => {
    const app = harness(sql => {
        if(sql.startsWith('SELECT * FROM listings')) return [{id:4,user_id:91,cover:'old.jpg',screenshots:['proof.jpg']}];
        if(sql.startsWith('UPDATE listings')) return [];
        throw new Error(sql);
    });
    const res = await app.call('put /listings/:listingId/edit',{description:'New description',price:'35',form_type:'1',link:'changed',is_pinned:'true',position:'1'});
    assert.equal(res.statusCode,200);
    const update = app.queries.find(x=>x.sql.startsWith('UPDATE'));
    assert.ok(!/category_id|form_type|link=|screenshots=|cover=|is_pinned|position=/.test(update.sql));
    assert.deepEqual(Array.from(update.values),['New description',35,4,91]);
});
test('another user cannot edit or raise the listing', async () => {
    for(const route of ['put /listings/:listingId/edit','post /listings/:listingId/up']) {
        const app = harness(sql => {if(sql.startsWith('SELECT'))return [{id:4,user_id:92,up_date:null}];throw new Error(sql);});
        assert.equal((await app.call(route,{price:'1'})).statusCode,403);
        assert.ok(!app.queries.some(x=>x.sql.startsWith('UPDATE')));
    }
});
test('listing media reuses the YouTube parser, caches requests and hides the channel URL', async () => {
    let calls=0;
    const app = harness(()=>[{link:'https://www.youtube.com/channel/UCtest',form_type:1,slug:'youtube'}],async(url,options)=>{
        calls++;assert.equal(options.params.id,'UCtest');return {data:{items:[{snippet:{title:'Test',thumbnails:{high:{url:'https://yt3.ggpht.com/photo'}}},statistics:{subscriberCount:'150'}}]}};
    });
    const first = await app.call('get /listings/:listingId/media');
    await app.call('get /listings/:listingId/media');
    assert.equal(calls,1);assert.equal(first.statusCode,200);assert.equal(first.body.subscribers,'150');
    assert.ok(first.body.avatar.startsWith('/market/avatar-image?url='));assert.ok(!JSON.stringify(first.body).includes('UCtest'));
});

test('detail templates render both listing types, owners and visitors with escaped comments', async () => {
    const ejs = require('ejs');
    for (const channel of [true,false]) for (const owner of [true,false]) {
        const listing = {id:4,name:'Test <channel>',description:'Description',price:50,form_type:channel?1:2,platform_slug:'youtube',category_name:channel?'Купить канал':'Исполнитель',user_id:91,user:{id:91,username:'Seller',avatar:'/market/uploads/avatars/custom/me.png',contacts:{email:'seller@example.com'}},created_at:new Date(),screenshots:[],allow_comments:owner,link:'https://www.youtube.com/channel/UCprivate',show_link:false};
        const comments = [{id:1,user_id:91,message:'<img src=x onerror=alert(1)>',author_name:'<script>',created_at:new Date(),parent_id:null}];
        const html = await ejs.renderFile(path.resolve(__dirname,'../server/views/market/post.ejs'), {listing,user:listing.user,currentUser:{id:owner?91:92},comments,...detailView(listing,comments)});
        assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'));
        assert.ok(!html.includes('UCprivate'));
        assert.equal(html.includes('id="edit-dialog"'),owner);
        assert.equal(html.includes('data-channel-id="4"'),channel);
        assert.ok(html.includes('/market/uploads/avatars/custom/me.png'));
        if(owner) assert.ok(html.includes('value="seller@example.com"'));
    }
});
