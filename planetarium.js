window.AVAILABLE_LANGUAGES = ['en', 'nl'];
window.CONTROLS_TIMEOUT = 60;


class PlanetariumLabel {
    constructor(element, context) {
        this.element = element;
        
        element.querySelector('set')?.remove();
        this.triggers = Array.from(context.querySelectorAll(element.dataset.trigger));
        for (let el of this.triggers) {
            el.addEventListener('mouseenter', this.handleMouseEnter.bind(this));
            el.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
            el.addEventListener('click', this.handleClick.bind(this));
        }
        document.addEventListener('click', this.handleDocumentClick.bind(this));
    }

    handleMouseEnter(event) {
        this.element.setAttribute('visibility', 'visible');
    }

    handleMouseLeave(event) {
        if (this.element.dataset.visible !== 'true')
            this.element.setAttribute('visibility', 'hidden');
    }

    handleClick(event) {
        this.element.dataset.visible = this.element.dataset.visible !== 'true';
        if (this.element.dataset.visible === 'true')
            this.element.setAttribute('visibility', 'visible');
        else
            this.element.setAttribute('visibility', 'hidden');
    }

    handleDocumentClick(event) {
        if (this.triggers.every(el => !el.contains(event.target))) {
            this.element.dataset.visible = false;
            this.element.setAttribute('visibility', 'hidden');
        }
    }
}


class Planetarium {
    constructor(context) {
        // Init svg (font scale is initialised separately)
        this.element = context.querySelector('.planetarium svg');
        // Init labels
        this.element.querySelectorAll('[data-trigger]').forEach(element => new PlanetariumLabel(element, this.element));
        this.initControls(context);
    }

    initControls(context) {
        this.controlsElement = context.querySelector('.navigation');

        // Init controls
        this.playButtons = context.querySelectorAll('[data-action=play-animation]');
        this.playButtons.forEach(el => el.addEventListener('click', this.handlePlay.bind(this)));

        this.pauseButtons = context.querySelectorAll('[data-action=pause-animation]');
        this.pauseButtons.forEach(el => el.addEventListener('click', this.handlePause.bind(this)));

        this.enterFullscreenButtons = context.querySelectorAll('[data-action=enter-fullscreen]');
        this.enterFullscreenButtons.forEach(el => el.addEventListener('click', this.handleEnterFullscreen.bind(this)));
        this.exitFullscreenButtons = context.querySelectorAll('[data-action=exit-fullscreen]');
        this.exitFullscreenButtons.forEach(el => el.addEventListener('click', this.handleExitFullscreen.bind(this)));
        
        // deliberately not on context but on document
        document.addEventListener('keydown', this.handleKeydown.bind(this));
        document.addEventListener('fullscreenchange', this.handleFullscreenChange.bind(this));
        document.addEventListener('webkitfullscreenchange', this.handleFullscreenChange.bind(this));
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('click', this.handleDocumentClick.bind(this));

        // Set initital control state (with intended side effect to disable animation)
        this.handlePause();
        this.handleFullscreenChange();
    }

    handlePlay() {
        this.element.unpauseAnimations();
        this.playButtons.forEach(el => el.hidden = true);
        this.pauseButtons.forEach(el => el.hidden = false);
    }

    handlePause() {
        this.element.pauseAnimations();
        this.playButtons.forEach(el => el.hidden = false);
        this.pauseButtons.forEach(el => el.hidden = true);
    }

    handleEnterFullscreen() {
        document.body.requestFullscreen();
        console.log('banaan');
        return;
        const element = document.querySelector('[data-fullscreen-container]');
        if (element.requestFullscreen)
            element.requestFullscreen();
        else if (element.webkitRequestFullscreen)
            element.webkitRequestFullscreen();
    }

    handleExitFullscreen() {
        if (document.exitFullscreen)
            document.exitFullscreen();
        else if (document.webkitExitFullscreen)
            document.webkitExitFullscreen();
    }

    handleFullscreenChange(event) {
        if (document.fullscreenElement || document.webkitFullscreenElement) {
            this.enterFullscreenButtons.forEach(el => el.hidden = true);
            this.exitFullscreenButtons.forEach(el => el.hidden = false);
            this.showControls();
        } else {
            this.enterFullscreenButtons.forEach(el => el.hidden = false);
            this.exitFullscreenButtons.forEach(el => el.hidden = true);
            this.controlsElement.hidden = false;
        }
    }

    handleDocumentClick(event) {
        this.showControls();
    }

    handleMouseMove(event) {
        // Only show after substantial movement
        if (Math.abs(event.movementX) + Math.abs(event.movementY) > 100)
            this.showControls();
    }

    handleKeydown(event) {
        // Don't prevent normal keyboard shortcuts
        if (event.shiftKey || event.metaKey || event.ctrlKey)
            return;

        switch (event.key) {
            case ' ':
            case 'k':
            case 'K':
                this.togglePlay(event);
                break;
            case 'f':
            case 'F':
                this.toggleFullscreen(event);
                break;
            case 'Right': // IE/Edge specific value
            case 'ArrowRight':
                this.handleNext(event);
                break;
        }
    }

    togglePlay(event) {
        if (this.element.animationsPaused())
            this.handlePlay(event);
        else
            this.handlePause(event);
    }

    toggleFullscreen(event) {
        if (document.fullscreenElement)
            this.handleExitFullscreen(event);
        else
            this.handleEnterFullscreen(event);
    }

    hideControls() {
        if (document.fullscreenElement || document.webkitFullscreenElement) {
            this.controlsElement.hidden = true;
        }
    }

    showControls() {
        if (this.controlsTimeout)
            clearTimeout(this.controlsTimeout);
        this.controlsElement.hidden = false;
        this.controlsTimeout = setTimeout(this.hideControls.bind(this), window.CONTROLS_TIMEOUT * 1000);
    }
}


function initSvgFontScale() {
    const fontSize = Number(window.getComputedStyle(document.body).getPropertyValue('font-size').match(/\d+/)[0]);
    document.querySelectorAll('svg.scaled-fonts').forEach(svg => {
        const rect = svg.getBoundingClientRect();
        const box = svg.viewBox.baseVal;
        const pixelRatio = box.width/Math.min(rect.width, rect.height);
        svg.style.setProperty('--base-font-size', `${fontSize * pixelRatio}px`);
    });

}

function initLanguage() {
    const url = new URL(window.location.href);
    let searchParams = url.searchParams;

    if (searchParams.has('lang') && window.AVAILABLE_LANGUAGES.includes(searchParams.get('lang').toLowerCase()))
        document.documentElement.lang = searchParams.get('lang').toLowerCase();
    else if (/^nl\b/.test(navigator.language))
        document.documentElement.lang = navigator.language;
}

initLanguage();
initSvgFontScale();
new Planetarium(document);
