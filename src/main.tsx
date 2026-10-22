import { render } from 'preact';
import { App } from './app/App';
import { initUpdates } from './app/update';
import './ui/styles.css';

initUpdates();
render(<App />, document.getElementById('app')!);
