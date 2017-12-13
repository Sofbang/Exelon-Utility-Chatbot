/**
 * The ExpressJS namespace.
 * @external ExpressApplicationObject
 * @see {@link http://expressjs.com/3x/api.html#app}
 */ 

/**
 * Mobile Cloud custom code service entry point.
 * @param {external:ExpressApplicationObject}
 * service 
 */
const apiURL = '/mobile/custom/ExelonBGEUtilityBotCC/components';
var shell = require('./shell')();

/**
 * Mobile Cloud custom code service entry point.
 * @param {external:ExpressApplicationObject}
 * service
 */
module.exports = function(service) {

  /**
   * Retrieves metadata for components implemented by this service.
   */
  service.get(apiURL, function(req,res) {
    res.set('Content-Type', 'application/json')
       .status(200)
       .json(shell.getAllComponentMetadata());
  });

  /**
   * Invoke the named component
   */
  service.post(apiURL+'/:componentName', function(req,res) {
    const sdkMixin = { oracleMobile: req.oracleMobile };
    shell.invokeComponentByName(req.params.componentName, req.body, sdkMixin, function(err, data) {
        if (!err) {
            res.status(200).json(data);
        }
        else {
            switch (err.name) {
                case 'unknownComponent':
                    res.status(404).send(err.message);
                    break;
                case 'badRequest':
                    res.status(400).json(err.details);
                    break;
                default:
                    res.status(500).json(err.details);
                    break;
            }
        }
    });
  });
};

