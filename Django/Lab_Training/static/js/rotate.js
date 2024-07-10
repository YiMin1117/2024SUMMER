let slideIndex = 0;
          const slides = document.querySelectorAll('.slide');
          
          function showSlides() {
            for (let i = 0; i < slides.length; i++) {
              slides[i].style.display = 'none';
            }
            slideIndex++;
            if (slideIndex > slides.length) {
              slideIndex = 1;
            }
            slides[slideIndex - 1].style.display = 'block';
          }
          
          setInterval(showSlides, 2000); // 每隔2秒调用一次showSlides函数，实现图片自动切换