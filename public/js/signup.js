
      const sign_in_btn = document.querySelector("#sign-in-btn");
      const sign_up_btn = document.querySelector("#sign-up-btn");
      const container = document.querySelector(".container");
      const login=document.getElementById("login")
      const signup=document.getElementById("signup")
//signup graphics
      sign_up_btn.addEventListener("click", () => {
        container.classList.add("sign-up-mode");
      });

      sign_in_btn.addEventListener("click", () => {
        container.classList.remove("sign-up-mode");
      });
//password toggle
      function togglePassword(id) {
        const passwordField = document.getElementById(id);
        const toggleIcon = passwordField.nextElementSibling;
        if (passwordField.type === "password") {
          passwordField.type = "text";
          toggleIcon.classList.remove("bi-eye");
          toggleIcon.classList.add("bi-eye-slash");
        } else {
          passwordField.type = "password";
          toggleIcon.classList.remove("bi-eye-slash");
          toggleIcon.classList.add("bi-eye");
        }
      }

// login actions
login.addEventListener("click",()=>
{
    const email=document.getElementById("signin-email").value;
    const password=document.getElementById("signin-password").value;
       const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

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
          
        }
          else if (!regex.test(email)) {
            Swal.fire({
                title: 'Invalid Email!',
                icon: 'error',
                toast: true,
                position: 'top-start',
                showConfirmButton: false,
                timer: 3000
            });
            return;
        }else{

        $.ajax({
            url: "/login",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify({ fullName, mobile }),
            success: function (response) {
                Swal.fire({
                    title: 'Login success',
                    icon: 'success',
                    toast: true,
                    position: 'top-center',
                    showConfirmButton: false,
                    timer: 3000
                }).then(()=>
                {
                    window.href="/"
                })
            },
            error: function (err) {
                if (err.responseJSON && err.responseJSON.message) {
                    Swal.fire({
                        title: err.responseJSON.message,
                        icon: 'error',
                        toast: true,
                        position: 'top-start',
                        showConfirmButton: false,
                        timer: 3000
                    });
                } else {
                    Swal.fire({
                        title: 'Something went wrong!',
                        icon: 'error',
                        toast: true,
                        position: 'top-center',
                        showConfirmButton: false,
                        timer: 3000
                    });
                }
            }
            
          });
}
       
})
//signup actions
signup.addEventListener('click',()=>
{
    const name = document.getElementById("name").value;
        const email = document.getElementById("email").value;
        const phone = document.getElementById("phone").value;
        const password = document.getElementById("signup-password").value;
        const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        const phonePattern = /^(\+?[0-9]{1,4})?[-\s]?[0-9]{10}$/;
         const regexpass = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

                
        if (name === '' || email === '' || phone === '' || password === '') {
            Swal.fire({
                title: 'All fields are required!',
                icon: 'error',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });
            
               }
    
        // Email validation
             else  if (!regex.test(email)) {
            Swal.fire({
                title: 'Invalid Email!',
                icon: 'error',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });
           
        }
    
          else if (!phonePattern.test(phone)) {
            Swal.fire({
                title: 'invalid phoneNumber!',
                icon: 'error',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });
                  }
    
        // Password validation (strong password check)
              else if (!regexpass.test(password)) {
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
        else
          {
    
        $.ajax({
            url: "/signup",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify({ name,email,phone,password }),
            success: function (response) {
                Swal.fire({
                    title: 'Otp sent',
                    icon: 'success',
                    toast: true,
                    position: 'top-center',
                    showConfirmButton: false,
                    timer: 3000
                }).then(()=>
                {
                    window.href="/verify-otp"
                })
            },
            error: function (err) {
                if (err.responseJSON && err.responseJSON.message) {
                    Swal.fire({
                        title: err.responseJSON.message,
                        icon: 'error',
                        toast: true,
                        position: 'top-start',
                        showConfirmButton: false,
                        timer: 3000
                    });
                } else {
                    Swal.fire({
                        title: 'Something went wrong!',
                        icon: 'error',
                        toast: true,
                        position: 'top-center',
                        showConfirmButton: false,
                        timer: 3000
                    });
                }
            }
            
          });
}
    
})
      
    
   
