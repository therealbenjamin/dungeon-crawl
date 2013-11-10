'use strict';

$(document).ready(initialize);

function initialize(){
  $(document).foundation();
  $('#form').on('submit', submitNewGame);
  $('#board').on('click', '.tile', clickMoveSpace);
}



//  ------------------------------------------------------------------ //
//  ------------------------------------------------------------------ //
//  ------------------------------------------------------------------ //

function submitNewGame(e) {
  var url = '/games/start?player=' + $('input[name="player"]').val() + '&numSquare=' + $('input[name="numSquare"]').val();
  sendGenericAjaxRequest(url, {}, 'post', null, e, function(data, status, jqXHR){
    htmlAddBoard(data, e);
  });
}

function clickMoveSpace(e) {
  var $tile = $(this);
  var $pastHero = $('#board > div.hero');
  $pastHero.removeClass('hero');
  if($('#health-bar > div.health').length === 0) {
    var $reason = $('<h3>');
    $reason.text('After many valiant attempts to rescue the Princess and retrieve the gold, a single solitary orc struck you down.');
    $('#board').prepend($reason);
    htmlAddGameOver();
  }
  var url = '/games/' + $('#board').data('game-id') + '/treasures';
  sendGenericAjaxRequest(url, {}, 'GET', null, e, function(data, status, jqXHR){
    console.log(data);
    hasPrincess(data, $tile);
    hasGold(data, $tile);
  });
  if($tile.hasClass('wormhole')) {
    var position = _.range($('div.tile').length);
    position = _.sample(position);
    $tile = $('#board > div.tile:nth-child(' + position + ')').addClass('hero');
  } else {
    $tile.addClass('hero');
  }
  htmlMoveDragon();
  htmlMoveOrcs();
  if($tile.hasClass('endPoint')) {
    askWinLose();
  }
}

//  ------------------------------------------------------------------ //
//  ------------------------------------------------------------------ //
//  ------------------------------------------------------------------ //

function htmlAddBoard(game, e){
  $('input[name="player"]').val('');
  $('input[name="numSquare"]').val('');
  $('#board > div').remove();
  $('#board > h3').remove();
  $('#sidebar > div').remove();
  for(var i = 0; i < game.numSquare; i++){
    var $space = $('<div>').addClass('tile').attr('data-position', [i]);
    $('#board').append($space);
  }
  $('#board').attr('data-game-id', game._id);
  var $endPoint = $('#board > div.tile:nth-child(' + game.endPoint + ')');
  $endPoint.addClass('endPoint');
  addWormHoles(game);
  addPlayer(game);
  addDragon(game);
  addOrcs(game);
  addHealth(game);
}

function htmlUpdateHealth(num) {
  $('#health-bar > div.health').remove();
  $('#health-bar > h4').remove();
  for(var i = 0; i < num; i++){
    var $health = $('<div>').addClass('health').attr('data-health-point', [i]);
    $('#health-bar').prepend($health);
  }
  var $hp = $('<h4>').text('HP: ' + $('#health-bar > div.health').length + ' pts');
  $('#health-bar').prepend($hp);
}

function htmlMoveDragon() {
  var $pastDragon = $('#board > div.dragon');
  $pastDragon.removeClass('dragon');
  var move = _.range($('div.tile').length);
  move = _.sample(move);
  var $dragon = $('#board > div.tile:nth-child(' + move + ')').addClass('dragon');
  if($dragon.hasClass('wormhole')) {
    var position = _.range($('div.tile').length);
    position = _.sample(position);
    $dragon = $('#board > div.tile:nth-child(' + position + ')').addClass('dragon');
  }
  if($dragon.hasClass('hero')){
    var $reason = $('<h3>');
    $reason.text('To dragons, heroes taste better than orcs.');
    $('#board').prepend($reason);
    htmlAddGameOver();
  }
}

function htmlMoveOrcs() {
  var $pastOrcs = $('#board > div.orc');
  $pastOrcs.addClass('pastOrc').removeClass('orc');
  var $orc;
  var positionArray = _.range($('div.tile').length);
  var move = _.range($('div.tile').length);
  for(var i = 0; i < $('#board > div.pastOrc').length; i++) {
    var position = _.sample(positionArray);
    var index = position;
    positionArray.splice(index, 1);
    var $tile = $('#board > div.tile:nth-child(' + position + ')');
    if(!$tile.hasClass('orc')) {
      $orc = $tile.addClass('orc');
      if($orc.hasClass('hero')) {
        var damage = _.sample([5,10,15,20,25]);
        var num = $('#health-bar > div.health').length;
        var health = num - damage;
        htmlUpdateHealth(health);
      }
      if($orc.hasClass('wormhole')){
        console.log('Touched the Wormhole!!');
        var newPosition = _.sample(move);
        index = newPosition;
        move.splice(index, 1);
        $orc = $('#board > div.tile:nth-child(' + newPosition + ')').addClass('orc');
      }
    } else {
      console.log('Lost an orc');
    }
  }
  $pastOrcs.removeClass('pastOrc');
}

// Orcs disappear currently... the dragon eats them.  That is all.

function htmlAddGameOver() {
  $('#board > div.tile').remove();
  $('#health-bar > div.health').remove();
  $('#health-bar > h4').text('');
  $('#health-bar > h4').text('HP: 0 pts');
  var $gameOver = $('<div>');
  $gameOver.attr('id', 'game-over');
  $('#board').prepend($gameOver);
}

function htmlAddWerner() {
  $('#board > div.tile').remove();
  $('#health-bar > div.health').remove();
  var $werner = $('<div>');
  $werner.attr('id', 'werner');
  $('#board').prepend($werner);
}

//  ------------------------------------------------------------------ //
//  ------------------------------------------------------------------ //
//  ------------------------------------------------------------------ //
function addPlayer(game) {
  var $hero = $('#board > div.tile:nth-child(' + game.startPoint + ')');
  $hero.addClass('hero');
}

function addWormHoles(game) {
  for(var i =0; i < game.wormholes.length; i++){
    var $wormhole = $('#board > div.tile:nth-child(' + game.wormholes[i] + ')');
    $wormhole.addClass('wormhole');
  }
}

function addDragon(game) {
  var $dragon = $('#board > div.tile:nth-child(' + game.dragon.position + ')');
  $dragon.addClass('dragon');
}

function addOrcs(game) {
  for(var i =0; i < game.orcs.length; i++){
    var $orc = $('#board > div.tile:nth-child(' + game.orcs[i].position + ')');
    $orc.addClass('orc');
  }
}

function addHealth(game, e) {
  var url = '/games/' + game._id + '/health';
  sendGenericAjaxRequest(url, {}, 'GET', null, e, function(data, status, jqXHR){
    htmlUpdateHealth(data.hero.health);
  });
}

function hasPrincess(game, tile) {
  if(tile.data('position') === game.princess){
    if(!$('div.tile').hasClass('princess')) {
      alert('Congratulations! You found the princess!');
      var $princess = $('<div>').attr('id', 'princess');
      $('#sidebar').append($princess);
      tile.addClass('princess');
    }
  }
}

function hasGold(game, tile) {
  if(tile.data('position') === game.gold) {
    if(!$('div.tile').hasClass('gold')) {
      alert('Congratulations! You found the gold!');
      var $gold = $('<div>').attr('id', 'gold');
      $('#sidebar').append($gold);
      tile.addClass('gold');
    }
  }
}

function askWinLose() {
  if($('div.tile').hasClass('gold', 'princess')) {
    htmlAddWerner();
  } else {
    var $reason = $('<h3>');
    $reason.text('Coward! You are supposed to rescue the princess AND get the treasure before escaping the dungeon!');
    $('#board').prepend($reason);
    htmlAddGameOver();
  }
}

function sendGenericAjaxRequest(url, data, verb, altVerb, event, successFn){
  var options = {};
  options.url = url;
  options.type = verb;
  options.data = data;
  options.success = successFn;
  options.error = function(jqXHR, status, error){console.log(error);};

  if(altVerb) options.data._method = altVerb;
  $.ajax(options);
  if(event) event.preventDefault();
}

//  ------------------------------------------------------------------ //
//  ------------------------------------------------------------------ //
//  ------------------------------------------------------------------ //