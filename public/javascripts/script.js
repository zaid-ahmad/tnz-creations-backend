const close = document.querySelector('.closebtn')
const alert = document.querySelector('.alert')

close.addEventListener('click', () => {
    alert.style.opacity = '0'
    setTimeout(function () {
        alert.style.display = 'none'
    }, 300)
})
