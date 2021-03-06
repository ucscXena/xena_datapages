/*global require: false, module: false */
'use strict';
var _ = require('./underscore_ext');
var {defaultState} = require('./defaults');
var {updateHostStatus} = require('./session');

// After settings change, update the list of hosts that
// are in use for the session.
var setUserServers = state => {
	let {activeHosts, userHosts} = state.servers;
	return _.assocIn(state, ['servers', 'pending'],
			_.intersection(activeHosts, userHosts));
};

function updateAllHosts(state) {
	state.allHosts.forEach(function(host) {
		updateHostStatus(host); // only currently update sessinostorage, not state ( :( )
	});
}

function setHubs(state, {hubs}) {
	return hubs ?
		hubs.reduce(
			(state, hub) =>_.assocIn(state, ['servers', hub, 'user'], true),
			state) :
		state;
}

var controls = {
	init: (state, params) => setHubs(_.updateIn(state, ['servers'], s => _.merge(defaultState, s)), params),
	'init-post!': (serverBus, state, newState) => updateAllHosts(newState),
	'add-host': (state, list, host) =>
		setUserServers(_.updateIn(state, ['servers', list], l => _.union(l, [host]))),
	'remove-host': (state, list, host) =>
		setUserServers(_.updateIn(state, ['servers', list], l => _.difference(l, [host]))),
	 cohort: (state, cohort) => _.assoc(state, 'cohortPending', [{name: cohort}])
};

var identity = x => x;

module.exports = {
	action: (state, [tag, ...args]) => (controls[tag] || identity)(state, ...args),
	postAction: (serverBus, state, [tag, ...args]) => (controls[tag + '-post!'] || identity)(serverBus, state, ...args)
};
