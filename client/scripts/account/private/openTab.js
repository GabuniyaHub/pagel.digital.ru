function openTab(evt, tabName) {
    const tab = document.getElementById(tabName);
    if (!tab) return;
    document.querySelectorAll('.tab-content').forEach(item => item.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(button => button.classList.remove('active'));
    tab.classList.add('active');
    evt?.currentTarget?.classList.add('active');
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('a[href="#ads"], a[href="#settings"], a[href="#reviews"], a[href="#deals"]').forEach(link => {
        link.addEventListener('click', event => {
            const tabName = link.getAttribute('href').slice(1);
            openTab(null, tabName);
        });
    });
});
