function toggleMenu() {
    console.log('toggleMenu() called');
    const menu = document.querySelector('nav ul');
    const burger = document.querySelector('.burger-menu');
    
    if (!menu || !burger) {
        console.error('Menu or burger not found');
        return;
    }
    
    console.log('Toggling classes');
    menu.classList.toggle('active');
    burger.classList.toggle('active');
    
    console.log('Menu classes:', menu.className);
    console.log('Burger classes:', burger.className);
}
