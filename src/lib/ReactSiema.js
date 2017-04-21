import React, { Component, PropTypes } from 'react';
import debounce from './utils/debounce';
import transformProperty from './utils/transformProperty';

class ReactSiema extends Component {
    static propTypes = {
        resizeDebounce: PropTypes.number,
        duration: PropTypes.number,
        easing: PropTypes.string,
        perPage: PropTypes.number,
        startIndex: PropTypes.number,
        draggable: PropTypes.bool,
        threshold: PropTypes.number,
        loop: PropTypes.bool,
        children: PropTypes.oneOfType([
            PropTypes.element,
            PropTypes.arrayOf(PropTypes.element)
        ]),

        // Fire events after change
        onAfterChange: PropTypes.func,
    };

    events = [
        'onTouchStart', 'onTouchEnd', 'onTouchMove', 'onMouseDown', 'onMouseUp', 'onMouseLeave', 'onMouseMove', 'onClick'
    ];

    state = {
        dragged: false,
    }

    constructor(props) {
        super();
        this.config = Object.assign({}, {
            resizeDebounce: 250,
            duration: 200,
            easing: 'ease-out',
            perPage: 1,
            startIndex: 0,
            draggable: true,
            threshold: 20,
            loop: false,
        }, props);

        this.events.forEach((handler) => {
            this[handler] = this[handler].bind(this);
        });
    }

    componentDidMount() {
        this.config.selector = this.selector;
        this.currentSlide = this.config.startIndex;

        this.init();

        this.onResize = debounce(() => {
            this.resize();
            this.slideToCurrent();
        }, this.config.resizeDebounce);

        window.addEventListener('resize', this.onResize);

        if (this.config.draggable) {
            this.pointerDown = false;
            this.drag = {
                start: 0,
                end: 0,
            };
        }
    }

    componentDidUpdate() {
        this.init();
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.onResize);
    }

    init() {
        this.setSelectorWidth();
        this.setInnerElements();
        this.resolveSlidesNumber();

        this.setStyle(this.sliderFrame, {
            width: `${(this.selectorWidth / this.perPage) * this.innerElements.length}px`,
            webkitTransition: `all ${this.config.duration}ms ${this.config.easing}`,
            transition: `all ${this.config.duration}ms ${this.config.easing}`
        });

        for (let i = 0; i < this.innerElements.length; i++) {
            this.setStyle(this.innerElements[i], {
                width: `${100 / this.innerElements.length}%`
            });
        }

        this.slideToCurrent();
    }

    setSelectorWidth() {
        this.selectorWidth = this.selector.getBoundingClientRect().width;
    }

    setInnerElements() {
        this.innerElements = [].slice.call(this.sliderFrame.children);
    }

    resolveSlidesNumber() {
        if (typeof this.config.perPage === 'number') {
            this.perPage = this.config.perPage;
        } else if (typeof this.config.perPage === 'object') {
            this.perPage = 1;
            for (let viewport in this.config.perPage) {
                if (window.innerWidth > viewport) {
                    this.perPage = this.config.perPage[viewport];
                }
            }
        }
    }

    prev() {
        if (this.currentSlide === 0 && this.config.loop) {
            this.currentSlide = this.innerElements.length - this.perPage;
            if (this.props.onAfterChange) this.props.onAfterChange();
        } else {
            const nextSlide = Math.max(this.currentSlide - 1, 0);
            const shouldFireEvent = nextSlide !== this.currentSlide && this.props.onAfterChange;

            this.currentSlide = nextSlide;

            // If the next slide isn't the same, then fire the onAfterChange handler
            if (shouldFireEvent) this.props.onAfterChange();
        }
        this.slideToCurrent();
    }

    next() {
        if (this.currentSlide === this.innerElements.length - this.perPage && this.config.loop) {
            this.currentSlide = 0;
            if (this.props.onAfterChange) this.props.onAfterChange();
        } else {
            const nextSlide = Math.min(this.currentSlide + 1, this.innerElements.length - this.perPage);
            const shouldFireEvent = nextSlide !== this.currentSlide && this.props.onAfterChange;

            this.currentSlide = nextSlide;

            // If the next slide isn't the same, then fire the onAfterChange handler
            if (shouldFireEvent) this.props.onAfterChange();
        }
        this.slideToCurrent();
    }

    goTo(index) {
        this.currentSlide = Math.min(Math.max(index, 0), this.innerElements.length - 1);
        this.slideToCurrent();
        if (this.props.onAfterChange) this.props.onAfterChange();
    }

    slideToCurrent() {
        this.sliderFrame.style[transformProperty] = `translate3d(-${this.currentSlide * (this.selectorWidth / this.perPage)}px, 0, 0)`;
    }

    updateAfterDrag() {
        const movement = this.drag.end - this.drag.start;
        if (movement > 0 && Math.abs(movement) > this.config.threshold) {
            this.prev();
        } else if (movement < 0 && Math.abs(movement) > this.config.threshold) {
            this.next();
        }
        this.slideToCurrent();
    }

    resize() {
        this.resolveSlidesNumber();

        this.selectorWidth = this.selector.getBoundingClientRect().width;
        this.setStyle(this.sliderFrame, {
            width: `${(this.selectorWidth / this.perPage) * this.innerElements.length}px`
        });
    }

    clearDrag() {
        this.drag = {
            start: 0,
            end: 0,
        };
    }

    setStyle(target, styles) {
        Object.keys(styles).forEach((attribute) => {
            target.style[attribute] = styles[attribute];
        });
    }

    onTouchStart(e) {
        e.stopPropagation();
        this.pointerDown = true;
        this.firstMove = true;
        this.drag.start = e.touches[0].pageX;
        this.drag.startY = e.touches[0].pageY;
    }

    onTouchEnd(e) {
        e.stopPropagation();
        this.pointerDown = false;
        this.firstMove = true;
        this.setStyle(this.sliderFrame, {
            webkitTransition: `all ${this.config.duration}ms ${this.config.easing}`,
            transition: `all ${this.config.duration}ms ${this.config.easing}`
        });
        if (this.drag.end) {
            this.updateAfterDrag();
        }
        this.clearDrag();
    }

    onTouchMove(e) {
        // ensure swiping with one touch and not pinching
        if ( e.touches.length > 1 || (e.scale && e.scale !== 1)) return;

        if ( this.firstMove ) {
            this.firstMove = false;

            const touches = e.touches[0];

            // measure change in x and y
            const delta = {
                x: touches.pageX - this.drag.start,
                y: touches.pageY - this.drag.startY
            };

            if (Math.abs(delta.x) < Math.abs(delta.y)) {
                this.verticalScrolling = true
                return;
            }
            this.verticalScrolling = false
        }

        if (this.pointerDown && !this.verticalScrolling) {
            e.preventDefault();
            this.drag.end = e.touches[0].pageX;

            this.setStyle(this.sliderFrame, {
                webkitTransition: `all 0ms ${this.config.easing}`,
                transition: `all 0ms ${this.config.easing}`,
                [transformProperty]: `translate3d(${(this.currentSlide * (this.selectorWidth / this.perPage) + (this.drag.start - this.drag.end)) * -1}px, 0, 0)`
            });
        }
    }

    onClick(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    onMouseDown(e) {
        e.preventDefault();
        e.stopPropagation();

        this.pointerDown = true;
        this.drag.start = e.pageX;

        // At this point it's only a click
        this.setState({ dragged: false });
    }

    onMouseUp(e) {
        e.stopPropagation();
        this.pointerDown = false;
        this.setStyle(this.sliderFrame, {
            cursor: '-webkit-grab',
            webkitTransition: `all ${this.config.duration}ms ${this.config.easing}`,
            transition: `all ${this.config.duration}ms ${this.config.easing}`
        });

        // If drag.end has a value > 0, the slider has been dragged, update
        // state accordingly
        if (this.drag.end) {
            this.updateAfterDrag();
            this.setState({ dragged: true });
        }

        this.clearDrag();
    }

    onMouseMove(e) {
        e.preventDefault();
        if (this.pointerDown) {
            this.drag.end = e.pageX;
            this.setStyle(this.sliderFrame, {
                cursor: '-webkit-grabbing',
                webkitTransition: `all 0ms ${this.config.easing}`,
                transition: `all 0ms ${this.config.easing}`,
                [transformProperty]: `translate3d(${(this.currentSlide * (this.selectorWidth / this.perPage) + (this.drag.start - this.drag.end)) * -1}px, 0, 0)`
            });
        }
    }

    onMouseLeave(e) {
        if (this.pointerDown) {
            this.pointerDown = false;
            this.drag.end = e.pageX;
            this.setStyle(this.sliderFrame, {
                cursor: '-webkit-grab',
                webkitTransition: `all ${this.config.duration}ms ${this.config.easing}`,
                transition: `all ${this.config.duration}ms ${this.config.easing}`
            });
            this.updateAfterDrag();
            this.clearDrag();
        }
    }

    render() {
        return (
            <div
                ref={(selector) => this.selector = selector}
                style={{ overflow: 'hidden' }}
                {...this.events.reduce((props, event) => Object.assign({}, props, { [event]: this[event] }), {})}>
                <div ref={(sliderFrame) => this.sliderFrame = sliderFrame}>
                    {React.Children.map(this.props.children, (children, index) => {
                        return React.cloneElement(children, {
                            key: index,
                            style: { float: 'left' },
                            isClick: !this.state.dragged,
                        })
                    }
                    )}
                </div>
            </div>
        );
    }
}

export default ReactSiema;
