const client = require("../config/db");

async function createTables() {
    try {
        // Создание таблицы users
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                nickname VARCHAR(50) NOT NULL UNIQUE,
                rating INTEGER DEFAULT 0,
                avatar TEXT DEFAULT '../../images/account_circle_51dp_5F6368_FILL0_wght400_GRAD0_opsz48.png',
                email VARCHAR(100) NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                description TEXT DEFAULT NULL,
                google_id TEXT UNIQUE,
                verified BOOLEAN DEFAULT FALSE,
                is_blocked BOOLEAN DEFAULT FALSE,
                is_premium BOOLEAN DEFAULT FALSE,
                contacts JSONB DEFAULT '{}'::jsonb
            );
        `);

        // Создание таблицы медиа сетей
        await client.query(`
            CREATE TABLE IF NOT EXISTS platforms (
            id SERIAL PRIMARY KEY,            
            name VARCHAR(255) NOT NULL,
            slug VARCHAR(255) NOT NULL UNIQUE,
            icon VARCHAR(255),
            description TEXT
        );    
        `);

        // Создание категорий таблиц медиа сетей
        await client.query(`
            CREATE TABLE IF NOT EXISTS categories (
            id SERIAL PRIMARY KEY,
            platform_id INT NOT NULL,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            FOREIGN KEY (platform_id) REFERENCES platforms(id) ON DELETE CASCADE
        );    
        `);

        // Создание таблицы listings
        await client.query(`
            CREATE TABLE IF NOT EXISTS listings (
                id SERIAL PRIMARY KEY,
                name TEXT,
                link TEXT UNIQUE,
                theme TEXT,
                price NUMERIC CHECK (price > 0),
                income NUMERIC,
                expense NUMERIC,
                description TEXT NOT NULL,
                income_sources TEXT,
                expense_sources TEXT,
                promotion TEXT,
                support_needs TEXT,
                allow_comments BOOLEAN DEFAULT FALSE,
                show_link BOOLEAN DEFAULT FALSE,
                flex_switch BOOLEAN DEFAULT FALSE,
                screenshots TEXT[],
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
                monetization BOOLEAN DEFAULT FALSE,
                form_type INTEGER NOT NULL, 
                content_type TEXT DEFAULT 'copy' CHECK (content_type IN ('unique', 'rewrite', 'copy', 'mixed')),
                cover TEXT,
                views INTEGER DEFAULT 0,
                up_date TIMESTAMP DEFAULT NULL,
                position INTEGER DEFAULT 0,
                is_pinned BOOLEAN DEFAULT FALSE,
                pin_expiration_date TIMESTAMP DEFAULT NULL,
                contacts JSONB DEFAULT '{}'::jsonb,
                subscribers INTEGER DEFAULT 0,
                is_blocked BOOLEAN DEFAULT false
            );
        `);

        //Создание таблицы admins
        await client.query(`
            CREATE TABLE IF NOT EXISTS admins (
            id SERIAL PRIMARY KEY,
            email TEXT UNIQUE NOT NULL
            );
        `);

        // Создание таблицы отзывов (reviews)
        await client.query(`
            CREATE TABLE IF NOT EXISTS reviews (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                rating INTEGER,
                comment TEXT,
                review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                review_type VARCHAR(20) CHECK (review_type IN ('positive', 'neutral', 'negative'))
            );
        `);

        // Таблица избранные (favorites)
        await client.query(`
            CREATE TABLE IF NOT EXISTS favorites (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT NOW(),
                UNIQUE (user_id, listing_id) 
            );    
        `);

        // Таблица комментариев к листингу (comments_listings)
        await client.query(`
            CREATE TABLE IF NOT EXISTS comments_listings (
                id SERIAL PRIMARY KEY,
                listing_id INTEGER REFERENCES listings(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                message TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS deals (
                id SERIAL PRIMARY KEY,
                listing_id INT NOT NULL,        
                buyer_id INT NOT NULL,         
                seller_id INT NOT NULL,         
                price NUMERIC(10,2) NOT NULL,   
                status VARCHAR(50) DEFAULT 'pending', 
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP,
                CONSTRAINT fk_deal_listing FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
                CONSTRAINT fk_deal_buyer FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
                CONSTRAINT fk_deal_seller FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS confirmations (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                action VARCHAR(50) NOT NULL,
                code VARCHAR(10) NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                extra_data JSONB
            );
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_confirmations_user_action 
            ON confirmations(user_id, action);
        `);

        console.log("Таблицы 'users', 'listings', 'admins', 'platforms', 'categories' и 'reviews' успешно созданы или уже существуют.");
    } catch (error) {
        console.error("Ошибка при создании таблиц:", error);
    }
}

module.exports = createTables;
