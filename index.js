function toggleMenu() {
  const menu = document.getElementById('menuDropdown');
  menu.classList.toggle('abierto');
}

// Cierra el menú si se hace clic fuera de él
document.addEventListener('click', (e) => {
  const menu = document.getElementById('menuDropdown');
  const container = document.querySelector('.menu-container');
  if (menu && container && !container.contains(e.target)) {
    menu.classList.remove('abierto');
  }
});