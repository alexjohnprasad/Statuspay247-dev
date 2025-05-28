function toggleMenu() {
    const menu = document.querySelector('nav ul');
    const burger = document.querySelector('.burger-menu');
    menu.classList.toggle('active');
    burger.classList.toggle('active');
}

// Password visibility toggle
function togglePasswordVisibility(inputId) {
    const passwordInput = document.getElementById(inputId);
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    
    // Toggle the eye icon
    const toggleIcon = document.querySelector('#' + inputId + ' + .password-toggle i');
    if (toggleIcon) {
        toggleIcon.classList.toggle('fa-eye');
        toggleIcon.classList.toggle('fa-eye-slash');
    }
}

// City/District selection handlers
function handleCityChange() {
    const citySelect = document.getElementById("city");
    const otherCityContainer = document.getElementById("otherCityContainer");
    
    if (citySelect.value === "Other") {
        otherCityContainer.style.display = "block";
        document.getElementById("otherCity").required = true;
    } else {
        otherCityContainer.style.display = "none";
        document.getElementById("otherCity").required = false;
    }
}

function handleDistrictChange() {
    const districtSelect = document.getElementById("district");
    const otherDistrictContainer = document.getElementById("otherDistrictContainer");
    
    if (districtSelect.value === "Other") {
        otherCityContainer.style.display = "block";
        document.getElementById("otherDistrict").required = true;
    } else {
        otherCityContainer.style.display = "none";
        document.getElementById("otherDistrict").required = false;
    }
}

// Malayalam version handlers
function handleCityChangeML() {
    const citySelect = document.getElementById("city-ml");
    const otherCityContainer = document.getElementById("otherCityContainer-ml");
    
    if (citySelect.value === "Other") {
        otherCityContainer.style.display = "block";
        document.getElementById("otherCity-ml").required = true;
    } else {
        otherCityContainer.style.display = "none";
        document.getElementById("otherCity-ml").required = false;
    }
}

function handleDistrictChangeML() {
    const districtSelect = document.getElementById("district-ml");
    const otherDistrictContainer = document.getElementById("otherDistrictContainer-ml");
    
    if (districtSelect.value === "Other") {
        otherCityContainer.style.display = "block";
        document.getElementById("otherDistrict-ml").required = true;
    } else {
        otherCityContainer.style.display = "none";
        document.getElementById("otherDistrict-ml").required = false;
    }
}

// Age validation
function setMaxDate() {
    const today = new Date();
    const minYear = today.getFullYear() - 18;
    const minMonth = today.getMonth();
    const minDay = today.getDate();
    const maxDate = `${minYear}-${String(minMonth + 1).padStart(2, '0')}-${String(minDay).padStart(2, '0')}`;
    
    const dobInput = document.getElementById('dob');
    const dobInputML = document.getElementById('dob-ml');
    
    if (dobInput) {
        dobInput.setAttribute('max', maxDate);
    }
    if (dobInputML) {
        dobInputML.setAttribute('max', maxDate);
    }
}

function validateAge(dobInput) {
    const dob = new Date(dobInput.value);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    
    const ageError = document.getElementById("age-error");
    const submitBtn = document.getElementById("submit-btn");
    
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
    }
    
    if (age < 18) {
        ageError.style.display = "block";
        dobInput.setCustomValidity("You must be at least 18 years old to register.");
        submitBtn.disabled = true;
        return false;
    } else {
        ageError.style.display = "none";
        dobInput.setCustomValidity("");
        submitBtn.disabled = !document.getElementById("terms-accept").checked;
        return true;
    }
}

function validateAgeML(dobInput) {
    const dob = new Date(dobInput.value);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    
    const ageError = document.getElementById("age-error-ml");
    const submitBtnML = document.getElementById("submit-btn-ml");
    const termsAcceptedML = document.getElementById("terms-accept-ml") ? document.getElementById("terms-accept-ml").checked : false;
    
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
    }
    
    if (age < 18) {
        ageError.style.display = "block";
        dobInput.setCustomValidity("You must be at least 18 years old to register.");
        submitBtnML.disabled = true;
        return false;
    } else {
        ageError.style.display = "none";
        dobInput.setCustomValidity("");
        submitBtnML.disabled = !termsAcceptedML;
        return true;
    }
}

// CAPTCHA functions
function generateCaptcha() {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    document.getElementById("num1").textContent = num1;
    document.getElementById("num2").textContent = num2;
    document.getElementById("captcha-answer").value = "";
    return { num1, num2 };
}

function generateCaptchaML() {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    document.getElementById("num1-ml").textContent = num1;
    document.getElementById("num2-ml").textContent = num2;
    document.getElementById("captcha-answer-ml").value = "";
    return { num1, num2 };
}

// Initialize menu toggle
document.querySelector('.burger-menu').addEventListener('click', toggleMenu);

document.addEventListener('DOMContentLoaded', function() {
    // Language toggle functionality
    const btnEn = document.getElementById('btn-en');
    const btnMl = document.getElementById('btn-ml');
    const contentEn = document.getElementById('poster-content-en');
    const contentMl = document.getElementById('poster-content-ml');

    if (btnEn && btnMl && contentEn && contentMl) {
        // Set initial language based on button state
        if (localStorage.getItem('preferredLanguage') === 'ml') {
            contentEn.style.display = 'none';
            contentMl.style.display = 'block';
            btnMl.classList.add('active');
            btnEn.classList.remove('active');
        } else {
            contentEn.style.display = 'block';
            contentMl.style.display = 'none';
            btnEn.classList.add('active');
            btnMl.classList.remove('active');
        }

        // English button click handler
        btnEn.addEventListener('click', function() {
            contentEn.style.display = 'block';
            contentMl.style.display = 'none';
            btnEn.classList.add('active');
            btnMl.classList.remove('active');
            localStorage.setItem('preferredLanguage', 'en');
            document.getElementById('terms-summary-en').style.display = 'block';
            document.getElementById('terms-summary-ml').style.display = 'none';
        });

        // Malayalam button click handler
        btnMl.addEventListener('click', function() {
            contentEn.style.display = 'none';
            contentMl.style.display = 'block';
            btnMl.classList.add('active');
            btnEn.classList.remove('active');
            localStorage.setItem('preferredLanguage', 'ml');
            document.getElementById('terms-summary-en').style.display = 'none';
            document.getElementById('terms-summary-ml').style.display = 'block';
        });
    }

    // Initialize CAPTCHA
    generateCaptcha();
    generateCaptchaML();

    // Terms acceptance handlers
    const termsCheckbox = document.getElementById('terms-accept');
    const submitButton = document.getElementById('submit-btn');
    const termsCheckboxML = document.getElementById('terms-accept-ml');
    const submitButtonML = document.getElementById('submit-btn-ml');

    if (termsCheckbox && submitButton) {
        termsCheckbox.addEventListener('change', function() {
            submitButton.disabled = !this.checked;
        });
    }

    if (termsCheckboxML && submitButtonML) {
        termsCheckboxML.addEventListener('change', function() {
            const submitButtonML = document.getElementById('submit-btn-ml');
            submitButtonML.disabled = !this.checked;
        });
    }

    function validateAgeML(dobInput) {
        const dob = new Date(dobInput.value);
        const today = new Date();
        const age = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        
        const ageError = document.getElementById("age-error-ml");
        const submitBtnML = document.getElementById("submit-btn-ml");
        const termsAcceptedML = document.getElementById("terms-accept-ml") ? document.getElementById("terms-accept-ml").checked : false;
        
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
            age--;
        }
        
        if (age < 18) {
            ageError.style.display = "block";
            dobInput.setCustomValidity("You must be at least 18 years old to register.");
            submitBtnML.disabled = true;
            return false;
        } else {
            ageError.style.display = "none";
            dobInput.setCustomValidity("");
            submitBtnML.disabled = !termsAcceptedML;
            return true;
        }
    }

    // Form submission handler
    const posterForm = document.getElementById('posterForm');
    if (posterForm) {
        posterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validate CAPTCHA
            const num1 = parseInt(document.getElementById('num1').textContent);
            const num2 = parseInt(document.getElementById('num2').textContent);
            const answer = parseInt(document.getElementById('captcha-answer').value);
            
            if (answer !== num1 + num2) {
                alert('Please solve the math challenge correctly.');
                return;
            }

            // Show terms card
            const termsCard = document.getElementById('terms-card');
            const termsCheckbox = document.getElementById('terms-confirm');
            
            if (termsCard) {
                termsCard.style.display = 'block';
                termsCard.scrollIntoView({ behavior: 'smooth' });
                
                // Handle terms confirmation
                termsCheckbox.addEventListener('change', function() {
                    const finalSubmitBtn = document.getElementById('final-submit-btn');
                    finalSubmitBtn.disabled = !this.checked;
                });
                
                // Final submission handler
                document.getElementById('final-submit-btn').addEventListener('click', function() {
                    if (!termsCheckbox.checked) {
                        alert('Please confirm you have read and agree to the terms.');
                        return;
                    }
                    
                    // Show loading state
                    const submitBtn = document.getElementById('submit-btn');
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

                    // Simulate form submission
                    setTimeout(() => {
                        alert('Form submitted successfully! Our team will contact you shortly.');
                        posterForm.reset();
                        generateCaptcha();
                        termsCard.style.display = 'none';
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Submit Application';
                    }, 1500);
                });
            }
        });
    }

    // Malayalam form submission handler
    const posterFormML = document.getElementById('posterForm-ml');
    if (posterFormML) {
        posterFormML.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validate CAPTCHA
            const num1 = parseInt(document.getElementById('num1-ml').textContent);
            const num2 = parseInt(document.getElementById('num2-ml').textContent);
            const answer = parseInt(document.getElementById('captcha-answer-ml').value);
            
            if (answer !== num1 + num2) {
                alert('ദയവായി ശരിയായി ചെയ്യുക.');
                return;
            }

            // Show terms card
            const termsCard = document.getElementById('terms-card-ml');
            const termsCheckbox = document.getElementById('terms-confirm-ml');
            
            if (termsCard) {
                termsCard.style.display = 'block';
                termsCard.scrollIntoView({ behavior: 'smooth' });
                
                // Handle terms confirmation
                termsCheckbox.addEventListener('change', function() {
                    const finalSubmitBtn = document.getElementById('final-submit-btn-ml');
                    finalSubmitBtn.disabled = !this.checked;
                });
                
                // Final submission handler
                document.getElementById('final-submit-btn-ml').addEventListener('click', function() {
                    if (!termsCheckbox.checked) {
                        alert('ദയവായി നിബന്ധനകൾ വായിച്ച് സമ്മതിച്ചുവെന്ന് ഉറപ്പാക്കുക.');
                        return;
                    }
                    
                    // Show loading state
                    const submitBtn = document.getElementById('submit-btn-ml');
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> പ്രോസസ്സ് ചെയ്യുന്നു...';

                    // Simulate form submission
                    setTimeout(() => {
                        alert('ഫോം വിജയകരമായി സമർപ്പിച്ചു! ഞങ്ങളുടെ ടീം ഉടൻ തന്നെ നിങ്ങളെ ബന്ധപ്പെടും.');
                        posterFormML.reset();
                        generateCaptchaML();
                        termsCard.style.display = 'none';
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'അപേക്ഷ സമർപ്പിക്കുക';
                    }, 1500);
                });
            }
        });
    }
});

function validateAgeML(dobInput) {
    const dob = new Date(dobInput.value);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    
    const ageError = document.getElementById("age-error-ml");
    const submitBtnML = document.getElementById("submit-btn-ml");
    const termsAcceptedML = document.getElementById("terms-accept-ml") ? document.getElementById("terms-accept-ml").checked : false;
    
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
    }
    
    if (age < 18) {
        ageError.style.display = "block";
        dobInput.setCustomValidity("You must be at least 18 years old to register.");
        submitBtnML.disabled = true;
        return false;
    } else {
        ageError.style.display = "none";
        dobInput.setCustomValidity("");
        submitBtnML.disabled = !termsAcceptedML;
        return true;
    }
}
