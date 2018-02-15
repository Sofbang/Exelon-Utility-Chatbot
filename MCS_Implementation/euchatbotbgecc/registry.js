'use strict';

module.exports = {
  components: {
    // GDEB Bot
    'OutageStatus': require('./botservices/OutageStatus'),
    'ReportOutage': require('./botservices/ReportOutage'),
    'CheckBalance': require('./botservices/CheckBalance'),
    'CustomerSatisfaction': require('./botservices/CustomerSatisfaction'),
	'LogAnalytics': require('./botservices/LogAnalytics'),

    // Utility components
    'SetVariablesFromFile': require('./util/set_variables_from_file'),
    'SetVariableFromEntityMatches': require('./util/set_variable_from_entity_matches')
  }
};
