function openTab(evt, tabName) {
    let i, tabcontent, tabbuttons;
    tabcontent = document.getElementsByClassName("tab-content");
    for (i = 0; i < tabcontent.length; i++) { tabcontent[i].style.display = "none"; }
    tabbuttons = document.getElementsByTagName("button");
    for (i = 0; i < tabbuttons.length; i++) { tabbuttons[i].classList.remove("active"); }
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.classList.add("active");
}