function validateSignup() {
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const phone = document.getElementById("phone").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (name === '' || email === '' || phone === '' || password === '' || confirmPassword === '') {
        Swal.fire({
            title: 'All fields are required!',
            icon: 'error',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000
        });
        
        return false;
    }

    // Email validation
    const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!regex.test(email)) {
        Swal.fire({
            title: 'Invalid Email!',
            icon: 'error',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000
        });
        return false;
    }

    // Phone number validation
    const phonePattern = /^(\+?[0-9]{1,4})?[-\s]?[0-9]{10}$/;
    if (!phonePattern.test(phone)) {
        Swal.fire({
            title: 'invalid phoneNumber!',
            icon: 'error',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000
        });
        return false;
    }

    // Password validation (strong password check)
    const regexpass = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!regexpass.test(password)) {
        Swal.fire({
            title: 'Choose a Strong Password!(Example@123)',
            icon: 'error',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000
        });
        return false;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
        Swal.fire({
            title: 'Password Not Matching!',
            icon: 'error',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000
        });
        return false;
    }

    return true; // If all validation passes
}
function validateLogin()
{
    console.log("validating Login");
    
    const email=document.getElementById("loginEmail").value;
    const password=document.getElementById("loginpassword").value;
    if(email === ''||password ==='')
    {
        Swal.fire({
            title: 'All fields are required!',
            icon: 'error',
            toast: true,
            position: 'top-start',
            showConfirmButton: false,
            timer: 3000
        });
        return false;
    }
    const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!regex.test(email)) {
        Swal.fire({
            title: 'Invalid Email!',
            icon: 'error',
            toast: true,
            position: 'top-start',
            showConfirmButton: false,
            timer: 3000
        });
        return false;
    }
    return true;
}