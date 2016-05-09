(function(exports){
  exports.debugItem = {
    leftClick : function() {
      console.log("yo");
    },
    rightClick : function() {
      console.log("meh");
    }
  };
  exports.itemTwo = {
    leftClick : function() {
      
    },
    rigthClick : function() {
      
    }
  };
})(typeof exports === 'undefined'?this.itemScripts={}: exports);