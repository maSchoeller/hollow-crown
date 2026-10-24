import { render } from 'preact';
import { App } from './app/App';
import { installFaultListeners } from './app/state/fault';
import { initUpdates } from './app/update';
import { initPrepare } from './app/state/prepare';
import { startPacks } from './app/state/packs';
import './ui/base.css';
import './ui/styles.css';

installFaultListeners();
initPrepare();
initUpdates();
render(<App />, document.getElementById('app')!);
void startPacks();
