const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');
const container = document.getElementById('container');
const referal=document.getElementById("refer")
const referalCode=document.getElementById('referalCode')
const referBtn=document.getElementById('referBtn')

signUpButton.addEventListener('click', () => {
	container.classList.add("right-panel-active");
    referal.classList.remove("hide")
});

signInButton.addEventListener('click', () => {
	container.classList.remove("right-panel-active");
    referal.classList.add("hide")
});
referBtn.addEventListener('click',()=>
{
  referalCode.classList.remove('hide')
})

function togglePassword() {
    const passwordField = document.getElementById("password");
    const confirmPasswordField = document.getElementById("confirmPassword");

    const icon = document.getElementById("togglePassword");

    // If password is visible, hide it, and vice versa
    if (passwordField.type === "password") {
        passwordField.type = "text";
        confirmPasswordField.type = "text";
        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash");
    } else {
        passwordField.type = "password";
        confirmPasswordField.type = "password";
        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye");
    }
}
