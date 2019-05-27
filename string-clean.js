exports.sanitize = function(str, mode) {
  if(mode=="string"){
    return str.replace(/[^a-zA-Z]/g, "");
  };
  if(mode=="num-str"){
    return str.replace(/[^a-zA-Z0-9]/g, "");
  };
  if(mode=="user"){
    return str.replace(/[^a-zA-Z0-9_]/g, "");
  };
  if(mode=="email"){
    return str.replace(/[^a-zA-Z0-9_@.]/g, "");
  }
  if(mode=="date"){
    return str.replace(/[]/g, "");
  }
};
