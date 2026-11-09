(function(){const reg={};window.NEXUS_GAMES={register(id,def){reg[id]=def;def.id=id;},get(id){return reg[id]||null;},ids(){return Object.keys(reg);}};})();
