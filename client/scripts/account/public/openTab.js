function openTab(evt, tabName) {
    const tab = document.getElementById(tabName);
    if (!tab) return;
    document.querySelectorAll('.tab-content').forEach(item => item.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(button => button.classList.remove('active'));
    tab.classList.add('active');
    evt?.currentTarget?.classList.add('active');
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('a[href="#ads"], a[href="#reviews"], a[href="#deals"], a[href="#contacts"]').forEach(link => {
        link.addEventListener('click', () => openTab(null, link.getAttribute('href').slice(1)));
    });
});
