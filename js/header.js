function setActiveNavLink() {
  const links = document.querySelectorAll(".cs-header__link");
  const navLine = document.querySelector(".cs-header__nav-line");
  const currentPath = window.location.pathname; // /customer-relationship/

  let activeLink = null;

  links.forEach(link => {
    const linkPath = link.getAttribute("href");

    if (currentPath.startsWith(linkPath)) {
      link.classList.add("active");
      activeLink = link;
    }
  });

  // Fallback: first link active
  if (!activeLink && links.length) {
    activeLink = links[0];
    activeLink.classList.add("active");
  }

  // Move underline line
  if (activeLink) {
    gsap.set(navLine, {
      width: activeLink.offsetWidth,
      left: activeLink.offsetLeft
    });
  }
}

// Run after page load
window.addEventListener("load", setActiveNavLink);


function stickyHeaderScroll() {
  const header = document.querySelector(".cs-header");
  let lastScrollY = window.scrollY;

  window.addEventListener("scroll", () => {
    const currentScroll = window.scrollY;

    if (currentScroll > lastScrollY && currentScroll > 100) {
      // scrolling DOWN → hide
      header.classList.add("cs-header--hide");
    } else {
      // scrolling UP → show
      header.classList.remove("cs-header--hide");
    }

    lastScrollY = currentScroll;
  });
}

stickyHeaderScroll();