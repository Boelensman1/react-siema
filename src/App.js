import React, { Component } from 'react';
import ReactSiema from './lib/ReactSiema';
import logo from './logo.svg';
import './App.css';

class SlideItem extends Component {

    static propTypes = {
        style: React.PropTypes.object.isRequired,
        isClick: React.PropTypes.bool,
    }

    static defaultProps = {
        style: { float: 'left' },
    }

    shouldComponentUpdate(nextProps, nextState) {
        return false;
    }

    handleClick = () => {
        if (this.props.isClick) {
            console.log('Do the thing on click!');
        } else {
            console.log('Dragging, don\'t click!');
        }
    }

    render() {
        return (
            <div style={ this.props.style }>
                <img src={ this.props.src } alt="slide" onClick={ this.handleClick } />
            </div>
        );
    }
}

class App extends Component {
    state = {
        slides: [
            'https://unsplash.it/600/350?image=10',
            'https://unsplash.it/600/350?image=11',
            'https://unsplash.it/600/350?image=12',
            'https://unsplash.it/600/350?image=13',
            'https://unsplash.it/600/350?image=14',
            'https://unsplash.it/600/350?image=15',
            'https://unsplash.it/600/350?image=16',
        ]
    };

    render() {
        return (
            <div className="App">
                <div className="App-header">
                    <img src={logo} className="App-logo" alt="logo" />
                    <h2>React Siema</h2>
                </div>
                <div className="App-intro">
                    <h4>
                        Lightweight and simple carousel wrapper for React based on awesome <a href="https://pawelgrzybek.com/siema/">Siema</a>.
                    </h4>
                    <div className="App-intro__slider">
                        <ReactSiema ref={(siema) => this.siema = siema} onAfterChange={ ()=> { console.log('afterChange fired'); } } stopOnMouseLeave={false}>
                            {this.state.slides.map((slide, index) => {
                                return (
                                    <SlideItem key={index} src={ slide } />
                                )
                            } ) }
                        </ReactSiema>
                        <button onClick={() => this.siema.prev()}>Prev</button>
                        <button onClick={() => this.siema.next()}>Next</button>
                    </div>
                </div>
            </div>
        );
    }
}

export default App;
