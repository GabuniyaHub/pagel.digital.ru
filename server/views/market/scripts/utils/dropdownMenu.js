const menuIcon = document.getElementById("menu-icon");
const navLinks = document.getElementById("nav-links");

menuIcon.addEventListener('click', function () {
    menuIcon.classList.toggle('active');
    navLinks.classList.toggle('active');
});    