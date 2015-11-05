function loadImage(source, callback) {
  try {
    var image = new Image();
    image.onload = function() {
      //console.log('[image-loaded]');
      callback(image, source);
    };
    //console.log('[loadimage]' + source);
    image.src = source;
  } catch (e) {
    console.log('erro load image: '+e);
  }
}

function resetSession() {
  $.getJSON('/resetSession', function(data) {
  });
  return true;
}

$(function () {
  $('#download').click(function () {
    try {
      var canvas = document.getElementById('canvas');
      
      if (canvas.msToBlob) {
        var blob = canvas.msToBlob();
        window.navigator.msSaveBlob(blob, 'foto.png');
      } else {
        var dt = canvas.toDataURL('image/png');
        dt = dt.replace(/^data:image\/[^;]*/, 'data:application/octet-stream');
        dt = dt.replace(/^data:application\/octet-stream/, 'data:application/octet-stream;headers=Content-Disposition%3A%20attachment%3B%20filename=foto.png');
        console.log('[image]' + dt);
        this.href = dt;
      }
      //return true;
    } catch (err) {
      console.log('error: download ' + err);
    }
  });
  $('#ifUp').on('load', function () {
    $("#ifUp").contents().find("#uploadFile").on('change', function () {
      var timerId;
      timerId = setInterval(function() {
        if($("#ifUp").contents().find("#uploadFile").val() !== '') {
          clearInterval(timerId);
          $("#ifUp").contents().find("#upload").submit();
        }
      }, 500);
    });
    $("#ifUp").contents().find("#molduraID").val($('#molduraID').val());
    $('.loadImage').off('click');
    $('.loadImage').on('click', function () {
      $("#ifUp").contents().find("#posicaoID").val($(this).attr('data-id'));
      $("#ifUp").contents().find("#uploadFile").click();
    });
    $.getJSON( "/files.json", function(data) {
      var canvas = document.getElementById('canvas');
      var context = canvas.getContext('2d');
      var nextIdx = eval($('#molduraID').val());
      var mold = obj_molduras[nextIdx];
      //context.clearRect(0, 0, canvas.width, canvas.height);
      //loadImage(
      //    mold.fundo, 
      //    function(image) {
      //      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      //      console.log('[fundo]'+JSON.stringify(mold.fundo));
      //    }
      //  );
      $.each(data.uploads, function(i,elem) {
        var path = elem.file || elem;
        var x = elem.posicao.x;
        var y = elem.posicao.y;
        var w = elem.posicao.w;
        var h = elem.posicao.h;
        loadImage(
          path, 
          function(image) {
            context.drawImage(image, x, y, w, h);
            console.log('[photo' + i + ']'+JSON.stringify(path));
          }
        );
      });
      //loadImage(
      //  mold.fundo, 
      //  function(image) {
      //    context.drawImage(image, 0, 0, canvas.width, canvas.height);
      //    console.log('[fundo again]'+JSON.stringify(mold.fundo));
      //  }
      //);
      context.save();
    });
  });
  $('#clear-image').click(resetSession);
  $('.moldura').click(function () {
    resetSession();
    var $this = $(this);
    var canvas = document.getElementById('canvas');
    var context = canvas.getContext('2d');
    var nextIdx = eval($this.attr('data-id'));
    var mold = obj_molduras[nextIdx];
    //console.log('[before click]' + mold.fundo);
    context.clearRect(0, 0, canvas.width, canvas.height);
    loadImage(
      mold.fundo, 
      function(image) {
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        //console.log('[click]' + JSON.stringify(image));
        $('#uploads').val(0);
        $('#molduraID').val(mold.id);
        $("#ifUp").contents().find("#molduraID").val(mold.id);
        $('.buttons').html('');
        $.each(mold.posicoes, function (i) {
          $('.buttons').append('<button class="loadImage" data-id="' + mold.posicoes[i].id + '"></button>');
        });
        $('#ifUp').attr('src', $('#ifUp').attr('src'));
      }
    );
    context.save();
    return false;
  });
  $('.moldura:first').click();
});