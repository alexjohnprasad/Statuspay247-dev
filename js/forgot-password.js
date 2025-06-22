const API_URL = 'https://script.google.com/macros/s/AKfycbzraI_Ii_8bfSxaqYHmo2FhONUPcYxJuRhZghQueuvwZ4bQskpc40nqczAQYazramSRYw/exec';

function showForgotPasswordModal() {
    document.getElementById('forgotPasswordModal').style.display = 'block';
    document.getElementById('step1').style.display = 'block';
    document.getElementById('step2').style.display = 'none';
    document.getElementById('step3').style.display = 'none';
    document.getElementById('passwordResetStatus').style.display = 'none';
}

function closeForgotPasswordModal() {
    document.getElementById('forgotPasswordModal').style.display = 'none';
}

async function requestResetCode() {
    const phone = document.getElementById('forgotPhoneNumber').value.replace(/[^0-9]/g, "").slice(-10);
    const status = document.getElementById('passwordResetStatus');
    
    try {
        status.style.display = 'block';
        status.innerHTML = 'Sending reset code...';
        
        const response = await fetch(`${API_URL}?action=requestReset&phone=${phone}`);
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('step1').style.display = 'none';
            document.getElementById('step2').style.display = 'block';
            status.innerHTML = 'Reset code sent to your email!';
        } else {
            status.innerHTML = data.message || 'Failed to send reset code';
        }
    } catch (error) {
        status.innerHTML = 'Error sending reset code. Please try again.';
    }
}

async function verifyResetCode() {
    const phone = document.getElementById('forgotPhoneNumber').value.replace(/[^0-9]/g, "").slice(-10);
    const code = document.getElementById('resetCode').value;
    const status = document.getElementById('passwordResetStatus');
    
    try {
        status.style.display = 'block';
        status.innerHTML = 'Verifying code...';
        
        const response = await fetch(`${API_URL}?action=verifyCode&phone=${phone}&code=${code}`);
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('step2').style.display = 'none';
            document.getElementById('step3').style.display = 'block';
            status.innerHTML = 'Code verified! Set your new password.';
        } else {
            status.innerHTML = data.message || 'Invalid or expired code';
        }
    } catch (error) {
        status.innerHTML = 'Error verifying code. Please try again.';
    }
}

async function resetPassword() {
    const phone = document.getElementById('forgotPhoneNumber').value.replace(/[^0-9]/g, "").slice(-10);
    const code = document.getElementById('resetCode').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const status = document.getElementById('passwordResetStatus');
    
    if (newPassword !== confirmPassword) {
        status.innerHTML = 'Passwords do not match!';
        return;
    }
    
    try {
        status.style.display = 'block';
        status.innerHTML = 'Resetting password...';
        
        const hashedPassword = await hashPassword(newPassword);
        const response = await fetch(`${API_URL}?action=resetPassword&phone=${phone}&code=${code}&password=${hashedPassword}`);
        const data = await response.json();
        
        if (data.success) {
            status.innerHTML = 'Password reset successful! You can now login.';
            setTimeout(() => {
                closeForgotPasswordModal();
                window.location.reload();
            }, 2000);
        } else {
            status.innerHTML = data.message || 'Failed to reset password';
        }
    } catch (error) {
        status.innerHTML = 'Error resetting password. Please try again.';
    }
}
