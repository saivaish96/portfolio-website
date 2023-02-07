(function () {

	"use strict";
	$(document).ready(function () {
		console.clear();

		const panels = document.querySelectorAll('.panel');

		function toggleOpen(e) {
			if (e.currentTarget.className === 'panel panel1') {
				window.location.href = "cartoon-expanded.html";
			}
			else if (e.currentTarget.className === 'panel panel2') {
				window.location.href = "cartoon-expanded.html";
			}
			else if (e.currentTarget.className === 'panel panel3') {
				window.location.href = "cartoon-expanded.html";
			}
			else if (e.currentTarget.className === 'panel panel4') {
				window.location.href = "cartoon-expanded.html";
			}
			else if (e.currentTarget.className === 'panel panel5') {
				window.location.href = "cartoon-expanded.html";
			}
		}

		panels.forEach(panel => panel.addEventListener('click', toggleOpen));

		const config = {
			src:
				"https://s3-us-west-2.amazonaws.com/s.cdpn.io/175711/open-peeps-sheet.png",
			rows: 15,
			cols: 7
		};
		const select = (el, all = false) => {
			el = el.trim()
			if (all) {
				return [...document.querySelectorAll(el)]
			} else {
				return document.querySelector(el)
			}
		}
		// UTILS

		const randomRange = (min, max) => min + Math.random() * (max - min);

		const randomIndex = (array) => randomRange(0, array.length) | 0;

		const removeFromArray = (array, i) => array.splice(i, 1)[0];

		const removeItemFromArray = (array, item) =>
			removeFromArray(array, array.indexOf(item));

		const removeRandomFromArray = (array) =>
			removeFromArray(array, randomIndex(array));

		const getRandomFromArray = (array) => array[randomIndex(array) | 0];

		// TWEEN FACTORIES

		const resetPeep = ({ stage, peep }) => {
			const direction = Math.random() > 0.5 ? 1 : -1;
			// using an ease function to skew random to lower values to help hide that peeps have no legs
			const offsetY = 100 - 250 * gsap.parseEase("power2.in")(Math.random());
			const startY = stage.height - peep.height + offsetY;
			let startX;
			let endX;

			if (direction === 1) {
				startX = -peep.width;
				endX = stage.width;
				peep.scaleX = 1;
			} else {
				startX = stage.width + peep.width;
				endX = 0;
				peep.scaleX = -1;
			}

			peep.x = startX;
			peep.y = startY;
			peep.anchorY = startY;

			return {
				startX,
				startY,
				endX
			};
		};
		window.addEventListener('load', () => {
			let portfolioContainer = select('.portfolio-container');
			if (portfolioContainer) {
				let portfolioIsotope = new Isotope(portfolioContainer, {
					itemSelector: '.portfolio-item'
				});

				let portfolioFilters = select('#portfolio-flters li', true);

				on('click', '#portfolio-flters li', function (e) {
					e.preventDefault();
					portfolioFilters.forEach(function (el) {
						el.classList.remove('filter-active');
					});
					this.classList.add('filter-active');

					portfolioIsotope.arrange({
						filter: this.getAttribute('data-filter')
					});
					portfolioIsotope.on('arrangeComplete', function () {
						AOS.refresh()
					});
				}, true);
			}

		});
		// loader
		var loader = function () {
			setTimeout(function () {
				if ($('#ftco-loader').length > 0) {
					$('#ftco-loader').removeClass('show');
				}
			}, 1);
		};
		loader();

		const normalWalk = ({ peep, props }) => {
			const { startX, startY, endX } = props;

			const xDuration = 9.5;
			const yDuration = 0.25;

			const tl = gsap.timeline();
			tl.timeScale(randomRange(0.5, 1.5));
			tl.to(
				peep,
				{
					duration: xDuration,
					x: endX,
					ease: "none"
				},
				0
			);
			tl.to(
				peep,
				{
					duration: yDuration,
					repeat: xDuration / yDuration,
					yoyo: true,
					y: startY - 10
				},
				0
			);

			return tl;
		};

		const walks = [normalWalk];

		// CLASSES

		class Peep {
			constructor({ image, rect }) {
				this.image = image;
				this.setRect(rect);

				this.x = 0;
				this.y = 0;
				this.anchorY = 0;
				this.scaleX = 1;
				this.walk = null;
			}

			setRect(rect) {
				this.rect = rect;
				this.width = rect[2];
				this.height = rect[3];

				this.drawArgs = [this.image, ...rect, 0, 0, this.width, this.height];
			}

			render(ctx) {
				ctx.save();
				ctx.translate(this.x, this.y);
				ctx.scale(this.scaleX, 1);
				ctx.drawImage(...this.drawArgs);
				ctx.restore();
			}
		}

		// MAIN

		const img = document.createElement("img");
		img.onload = init;
		img.src = config.src;

		const canvas = document.querySelector("#canvas");
		const ctx = canvas.getContext("2d");

		const stage = {
			width: 0,
			height: 0
		};

		const allPeeps = [];
		const availablePeeps = [];
		const crowd = [];

		function init() {
			createPeeps();

			// resize also (re)populates the stage
			resize();

			gsap.ticker.add(render);
			window.addEventListener("resize", resize);
		}

		function createPeeps() {
			const { rows, cols } = config;
			const { naturalWidth: width, naturalHeight: height } = img;
			const total = rows * cols;
			const rectWidth = width / rows;
			const rectHeight = height / cols;

			for (let i = 0; i < total; i++) {
				allPeeps.push(
					new Peep({
						image: img,
						rect: [
							(i % rows) * rectWidth,
							((i / rows) | 0) * rectHeight,
							rectWidth,
							rectHeight
						]
					})
				);
			}
		}

		function resize() {
			stage.width = canvas.clientWidth;
			stage.height = canvas.clientHeight;
			canvas.width = stage.width * devicePixelRatio;
			canvas.height = stage.height * devicePixelRatio;

			crowd.forEach((peep) => {
				peep.walk.kill();
			});

			crowd.length = 0;
			availablePeeps.length = 0;
			availablePeeps.push(...allPeeps);

			initCrowd();
		}

		function initCrowd() {
			while (availablePeeps.length) {
				// setting random tween progress spreads the peeps out
				addPeepToCrowd().walk.progress(Math.random());
			}
		}

		function addPeepToCrowd() {
			const peep = removeRandomFromArray(availablePeeps);
			const walk = getRandomFromArray(walks)({
				peep,
				props: resetPeep({
					peep,
					stage
				})
			}).eventCallback("onComplete", () => {
				removePeepFromCrowd(peep);
				addPeepToCrowd();
			});

			peep.walk = walk;

			crowd.push(peep);
			crowd.sort((a, b) => a.anchorY - b.anchorY);

			return peep;
		}

		function removePeepFromCrowd(peep) {
			removeItemFromArray(crowd, peep);
			availablePeeps.push(peep);
		}

		function render() {
			canvas.width = canvas.width;
			ctx.save();
			ctx.scale(devicePixelRatio, devicePixelRatio);

			crowd.forEach((peep) => {
				peep.render(ctx);
			});

			ctx.restore();
		}

	});
	AOS.init({
		ease: 'slide',
		once: true
	});
	var rellaxHero = new Rellax('.rellaxHero');
	var rellax = new Rellax('.rellax', { center: true });

	var slider = function () {

		var carouselSlider = document.querySelectorAll('.carousel-testimony');
		if (carouselSlider.length > 0) {

			var testimonySlider = tns({
				container: '.carousel-testimony',
				items: 1,
				mode: 'carousel',
				autoplay: true,
				animateIn: 'tns-fadeIn',
				animateOut: 'tns-fadeOut',
				speed: 700,
				nav: true,
				gutter: 20,
				controls: false,
				autoplayButtonOutput: false,
				responsive: {
					0: {
						items: 1,
						gutter: 0
					},
					600: {
						items: 2,
						gutter: 20
					},
					1000: {
						items: 3,
						gutter: 20
					}
				}
			});

		}

	}
	slider();

	//COUNTER
	'use strict';
	// How long you want the animation to take, in ms
	const animationDuration = 2000;
	// Calculate how long each ‘frame’ should last if we want to update the animation 60 times per second
	const frameDuration = 1000 / 60;
	// Use that to calculate how many frames we need to complete the animation
	const totalFrames = Math.round(animationDuration / frameDuration);
	// An ease-out function that slows the count as it progresses
	const easeOutQuad = t => t * (2 - t);


	const numberWithCommas = n => {
		return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
	}

	// The animation function, which takes an Element
	const animateCountUp = el => {
		let frame = 0;
		const countTo = parseInt(el.innerHTML, 10);
		// Start the animation running 60 times per second
		const counter = setInterval(() => {
			frame++;
			// Calculate our progress as a value between 0 and 1
			// Pass that value to our easing function to get our
			// progress on a curve
			const progress = easeOutQuad(frame / totalFrames);
			// Use the progress value to calculate the current count
			const currentCount = Math.round(countTo * progress);

			// If the current count has changed, update the element
			if (parseInt(el.innerHTML, 10) !== currentCount) {
				el.innerHTML = numberWithCommas(currentCount);
			}

			// If we’ve reached our last frame, stop the animation
			if (frame === totalFrames) {
				clearInterval(counter);
			}
		}, frameDuration);
	};

	// Run the animation on all elements with a class of ‘countup’
	const runAnimations = () => {
		const countupEls = document.querySelectorAll('.countup');
		countupEls.forEach(animateCountUp);
	};




	// In Viewed
	var elements;
	var windowHeight;

	function init() {
		elements = document.querySelectorAll('.section-counter');
		windowHeight = window.innerHeight;
	}

	function checkPosition() {
		var i;
		for (i = 0; i < elements.length; i++) {
			var element = elements[i];
			var positionFromTop = elements[i].getBoundingClientRect().top;
			if (positionFromTop - windowHeight <= 0) {
				if (!element.classList.contains('viewed')) {
					element.classList.add('viewed');
					runAnimations();
				} else {
					if (element.classList.contains('viewed')) {

					}
				}

			}
		}
	}

	window.addEventListener('scroll', checkPosition);
	window.addEventListener('resize', init);

	init();
	checkPosition();

	const select = (el, all = false) => {
		el = el.trim()
		if (all) {
		  return [...document.querySelectorAll(el)]
		} else {
		  return document.querySelector(el)
		}
	  }
	  /**
   * Easy event listener function
   */
	   const on = (type, el, listener, all = false) => {
		let selectEl = select(el, all)
		if (selectEl) {
		  if (all) {
			selectEl.forEach(e => e.addEventListener(type, listener))
		  } else {
			selectEl.addEventListener(type, listener)
		  }
		}
	  }
	/**
	 * Porfolio isotope and filter
	 */
	window.addEventListener('load', () => {
		let artContainer = select('.art-container');
		if (artContainer) {
			let artIsotope = new Isotope(artContainer, {
				itemSelector: '.art-item',
				layoutMode: 'fitRows'
			});

			let artFilters = select('#art-flters li', true);

			on('click', '#art-flters li', function (e) {
				e.preventDefault();
				artFilters.forEach(function (el) {
					el.classList.remove('filter-active');
				});
				this.classList.add('filter-active');

				artIsotope.arrange({
					filter: this.getAttribute('data-filter')
				});

			}, true);
		}

	});

	// window.addEventListener('load', () => {
	// 	let blogContainer = select('.blog-container');
	// 	if (blogContainer) {
	// 		let blogIsotope = new Isotope(blogContainer, {
	// 			itemSelector: '.blog-item',
	// 			layoutMode: 'fitRows'
	// 		});

	// 		let blogFilters = select('#home-flters li', true);

	// 		on('click', '#home-flters li', function (e) {
	// 			e.preventDefault();
	// 			blogFilters.forEach(function (el) {
	// 				el.classList.remove('filter-active');
	// 			});
	// 			this.classList.add('filter-active');

	// 			blogIsotope.arrange({
	// 				filter: this.getAttribute('data-filter')
	// 			});

	// 		}, true);
	// 	}

	// });
	/**
	 * Initiate art lightbox 
	 */
	const artLightbox = GLightbox({
		selector: '.art-lightbox'
	});

	/**
	 * art details slider
	 */
	new Swiper('.art-details-slider', {
		speed: 400,
		loop: true,
		autoplay: {
			delay: 5000,
			disableOnInteraction: false
		},
		pagination: {
			el: '.swiper-pagination',
			type: 'bullets',
			clickable: true
		}
	});
	//GLIGHTBOX
	const lightbox = GLightbox({
		touchNavigation: true,
		loop: true,
		autoplayVideos: true
	});

})()

