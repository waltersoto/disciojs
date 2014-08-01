/*
 Local storage library in JavaScript for Node.js
 Copyright (c) 2014 Walter M. Soto Reyes 
*/
(function () {
    
    var fs = require('fs');
    var qA = require('qarr');

    var toStorage = function (json,file) {
        if (_exists(file) && json !== null) {
            fs.writeFile(file, JSON.stringify(json), function (err) {
                if (err) { 
                    return false;
                }
            });
        }
        return false;
    };
    
    var _exists = function (file) { 
        return fs.existsSync(file);
         
    }
    
    var _discioObject = function (item) { 
        for (p in item) {
            if (p === 'id') {
                return true;
                break;
            }
        }
        return false;
    };
    
    


    var discio = {

        source: {
            extension: 'json',
            maxRecords: 300,
            autoCreateSets: false,
            dataFolder: '.',
            exists: function (setName, location) { 
                if (typeof location === 'undefined') { location = ''; } 
                var file = discio.source.dataFolder + '/' + location + '/' + setName + '.' + discio.source.extension; 
                return _exists(file);
            }, 
            createIfMissing: function (setName, location) {
                if (!discio.source.exists(setName, location)) { 
                   return discio.source.create(setName, location);
                }
                return false;
            },
            create: function (setName, location) {
                if (typeof location === 'undefined') { location = ''; }
                var result = true;
                var file = discio.source.dataFolder + '/' + location + '/' + setName + '.' + discio.source.extension;
                if (_exists(file)) { 
                    return false;
                } else { 
                    var newSet = {
                        name: setName,
                        records: []
                    }; 
                    fs.writeFile(file, JSON.stringify(newSet), function (err) {
                        if (err) { return false; }
                    });
                }
 
                return true;
            }
        },

        manager: function (setName,location) {
            
            if (typeof location === 'undefined') { location = ''; }

            var file = discio.source.dataFolder + '/' + location + '/' + setName + '.' + discio.source.extension;
            var json = null;
            var toInsert = [];
            var toDelete = [];
            var toUpdate = [];
         
            if (_exists(file)) { 
                 json = JSON.parse(fs.readFileSync(file, 'utf8'));
            } 
             
            
            this.insert = function (item) {
                if (!_discioObject(item)) { 
                    item.id = 0;
                }
                toInsert.push(item);
            };

            this.remove = function (item) {
                if (_discioObject(item)) {
                    toDelete.push(item);
                } else { 
                    throw new Error("Trying to delete a non discio compliant object");
                }
            };

            this.update = function (item) { 
                if (_discioObject(item)) {
                    toUpdate.push(item);
                } else {
                    throw new Error("Trying to update a non discio compliant object");
                }
            };

            this.commit = function () {
                
                if (toInsert.length > 0) {
                     
                    var lastIndex = 0;
                    
                    if (json.records.length > 0) { 
                        lastIndex = json.records[json.records.length - 1].id;
                    }
                     
                    for (var i = 0, imax = toInsert.length; i < imax; i++) {
                        toInsert[i].id = ++lastIndex;
                        json.records.push(toInsert[i]);
                    } 
                    toStorage(json, file);
                    while (toInsert.length > 0) {
                        toInsert.pop();
                    }
                }

                if (toDelete.length > 0) { 
                    for (var d = 0, dmax = toDelete.length; d < dmax; d++) {  
                        var index = qA(json.records).indexOf(function (x) { return x.id === toDelete[d].id; });
                        if (index != -1) { 
                            json.records.splice(index, 1);
                        }
                    }
                    toStorage(json, file);
                    while (toDelete.length > 0) {
                        toDelete.pop();
                    }
                }

                if (toUpdate.length > 0) {
                    for (var u = 0, umax = toUpdate.length; u < umax; u++) {
                        if (json !== null && json.records.length > 0) { 
                            var uindex = qA(json.records).indexOf(function (x) { return x.id === toUpdate[u].id; });
                            if (uindex != -1) {
                                for (var uProp in toUpdate[u]) {
                                    if (uProp !== 'id') {
                                        json.records[uindex][uProp] = toUpdate[u][uProp];
                                    }
                                }
                            }

                        } 
                    }
                    toStorage(json, file);
                    while (toUpdate.length > 0) {
                        toUpdate.pop();
                    }
                }
            
            };
            
            this.query = function () { 
                return (json === null)?qA([]):qA(json.records);
            };

        }

    };
    

    module.exports = discio;
})();