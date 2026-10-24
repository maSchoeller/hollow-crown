import { render } from 'preact';
import { App } from './app/App';
import { installFaultListeners } from './app/state/fault';
import { initUpdates } from './app/update';
import './ui/base.css';
import './ui/styles.css';

installFaultListeners();
initUpdates();
render(<App />, document.getElementById('app')!);
