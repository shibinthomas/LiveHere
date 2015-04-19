LiveHere = new Backbone.Marionette.Application();


LiveHere.on('start',function(){

    if(Backbone.history){
        Backbone.history.start();
    }
});
LiveHere.start();