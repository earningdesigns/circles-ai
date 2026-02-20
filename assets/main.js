const slides = document.querySelectorAll('.carex-slide');
const dots = document.querySelectorAll('.dot');
const next = document.querySelector('.carex-next');
const prev = document.querySelector('.carex-prev');

let index = 0;

function showSlide(i){
  slides.forEach(s => s.classList.remove('active'));
  dots.forEach(d => d.classList.remove('active'));

  slides[i].classList.add('active');
  dots[i].classList.add('active');
}

next.onclick = () => {
  index = (index + 1) % slides.length;
  showSlide(index);
}

prev.onclick = () => {
  index = (index - 1 + slides.length) % slides.length;
  showSlide(index);
}

dots.forEach((dot,i)=>{
  dot.onclick = () => {
    index = i;
    showSlide(index);
  }
});

/* autoplay */
setInterval(()=>{
  index = (index + 1) % slides.length;
  showSlide(index);
}, 4000);