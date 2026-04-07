// Sunrise Chiropractic — Main Script

// Set current year in footer
document.getElementById('year').textContent = new Date().getFullYear();

// Mobile navigation toggle
const hamburger = document.getElementById('nav-hamburger');
const mobileNav = document.getElementById('nav-mobile');

if (hamburger && mobileNav) {
  hamburger.addEventListener('click', () => {
    mobileNav.classList.toggle('open');
  });

  // Close mobile nav when a link is clicked
  mobileNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileNav.classList.remove('open');
    });
  });
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const navHeight = document.getElementById('nav')?.offsetHeight || 72;
      const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 8;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

// Add nav shadow on scroll
const nav = document.getElementById('nav');
if (nav) {
  window.addEventListener('scroll', () => {
    nav.style.boxShadow = window.scrollY > 10
      ? '0 4px 20px rgba(0,0,0,0.10)'
      : '0 2px 12px rgba(0,0,0,0.06)';
  });
}
