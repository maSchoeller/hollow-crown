import { render } from 'preact';
import { App } from './app/App';
import { installFaultListeners } from './app/state/fault';
import { installTrail } from './app/state/rescue';
import { initUpdates } from './app/update';
import { initPrepare } from './app/state/prepare';
import { startPacks } from './app/state/packs';
import { startToneTest } from './app/state/toneTest';
import { wantsToneTest } from './app/toneTestPlan';
import './ui/base.css';
import './ui/styles.css';

installFaultListeners();
installTrail();
initPrepare();
initUpdates();
render(<App />, document.getElementById('app')!);
void startPacks();
// tone test of story 8.1: a direct link for testers on their phones (concept/23-art-direction/tonbruch-test.md)
if (wantsToneTest(location.search)) void startToneTest();
