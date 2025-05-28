function toggleMenu() {
    const menu = document.querySelector('nav ul');
    const burger = document.querySelector('.burger-menu');
    menu.classList.toggle('active');
    burger.classList.toggle('active');
}

document.querySelector('.burger-menu').addEventListener('click', toggleMenu);

document.addEventListener('DOMContentLoaded', function() {
    const termsCheckbox = document.getElementById('terms-accept');
    const submitButton = document.getElementById('submit-btn');

    if (termsCheckbox && submitButton) {
        termsCheckbox.addEventListener('change', function() {
            submitButton.disabled = !this.checked;
        });
    }

    const faqToggle = document.getElementById('faqToggle');
    const allFaqs = document.getElementById('all-faqs');

    if (faqToggle && allFaqs) {
        faqToggle.addEventListener('click', function() {
            allFaqs.classList.toggle('hidden');
            faqToggle.classList.toggle('active');
        });
    }

    const loadMoreBtn = document.getElementById('loadMoreFaq');
    const faqGroups = document.querySelectorAll('.faq-group');
    let currentGroup = 1;
    const totalGroups = 5; // Total number of FAQ groups

    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', function() {
            currentGroup++;
            
            // Show next group
            const nextGroup = document.getElementById(`faq-group-${currentGroup}`);
            if (nextGroup) {
                nextGroup.classList.remove('hidden');
                
                // Hide button if we've shown all groups
                if (currentGroup >= totalGroups) {
                    loadMoreBtn.style.display = 'none';
                }
            }
        });
    }
});
