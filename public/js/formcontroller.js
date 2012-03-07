(function (){
	'use strict';
	//run these commands when the javascript loads
	//hide elements that aren't meant to show on script load. 
	//global variable holding the template for the widget
	var widgetTemplate,
	minifiedWidget;
	$('.demowidget').hide().css('display').remove;
	$('.load').hide().css('display').remove;
	$('.code').hide().css('display').remove;
	$('#warningTxt').hide().css('display').remove;
	$('.check').hide().css('display').remove;
	widgetTemplate = //properly formatted template
		"<script type='text/javascript' data-r4dw-project_id='{ID}' data-r4dw-chromeless='{CHROME}'>" +
		"\n\t(function() {" + 
		"\n\t\tvar script = document.createElement('script');" + 
		"\n\t\tscript.type = 'text/javascript';"+
		"\n\t\tscript.async = true;" + 
		"\n\t\tscript.src = '{HOST}/widgets/r4d.js';" +
		"\n\t\tvar entry = document.getElementsByTagName('script')[0];" +
		"\n\t\tentry.parentNode.insertBefore(script, entry);"+	
		"\n\t}());" +
		"\n</script>";
		//minified widget template for insertion into the example template
	minifiedWidget = "(function() {var script = document.createElement('script');script.type = 'text/javascript';script.async = true;script.src = '{HOST}/widgets/r4d.js';var entry = document.getElementsByTagName('script')[0];entry.parentNode.insertBefore(script, entry);}());";

	function template(src, data){ //my templating language
		//console.log(swap.length);
		$.each(data, function(k,v){
			src = src.split("{" + k + "}").join(v);
		});
		return src;
	}

	function createDemo(projectID, chromeless, host){ //this is a required work-around to allow insertion of script elelment
		var widget = document.createElement('script');
		widget.setAttribute('data-r4dw-project_id',projectID);
		widget.setAttribute('data-r4dw-chromeless',chromeless);
		widget.innerHTML=template(minifiedWidget, {"HOST": host});
		document.getElementById('scriptarea').appendChild(widget);
		isWidgetLoaded(widgetLoaded);
	}

	function isWidgetLoaded(callback){ //polling to check whether the widget has loaded
		(function poll() {
			var node = $('div[class=development-widget]');
			console.log(node);
			if (node){
				callback();
			} else {
				setTimeout(poll, 100);
			}
		}());
	}

	function widgetLoaded(){ // to be executed only after the objects have been loaded and are at a final location
		$('.load').hide('slow', function(){
			$('textarea').show('fast', function(){
				$('div.b').css('background-color', '#707070').show(0, function(){
					applyzClip();
				});
			});
		});
	}

	function applyzClip(){ //function to add the invisible flash element to the object
		$('div.b').zclip('remove');
		$('div.b').zclip({								// the div needs to exist, on page load
			path:'js/ZeroClipboard.swf',
			copy:$('textarea').val(),
			afterCopy:function(){
				$('div.b').css('background-color','green');
				$('.check').show();
				applyzClip();
			}			
		});		
	}

	$(document).on('focus', 'textarea', function(){ //function controlling what to do when the textarea gains focus
		var self=$(this);
		self.select();
		self.mouseup(function() { //fix for chrome's little problem
			//prevent further mousup intervention
			self.unbind("mouseup");
			return false;
		});
	});

	$(document).on('submit', 'form', function(evt){ //function controlling the widget code generation
		//var declaration
		var projectID, 
			chromeless,
			url_parser = $('<a></a>').attr('href', document.URL),
			host;	
		
		evt.preventDefault(); //prevent default action upon submit
		projectID = $('input[type=text]', this).val(); // get the inputted project ID
		chromeless = ($('input[type=checkbox]', this).attr('checked')==="checked"); // get whether the chromeless checkbox is checked
		
		host = template("{protocol}//{host}", {"protocol":url_parser.prop('protocol'), "host":url_parser.prop('host')});

		if ($.isNumeric(projectID) && projectID == Math.round(projectID) && projectID > 0){ //check if projectID is a valid number
			$('#warningTxt',this).hide('fast');//show/hide and re-colour elements. 
			$('.check', this).hide();
			$('.code').hide('fast');
			$('textarea', this).val(
				template(
					widgetTemplate,
					{
						"ID": projectID,
						"CHROME": chromeless,
						"HOST": host
					}
				)
			);
			/**
			* Manually remove any r4d styles from the page to work around 
			* issues when regenerating chromed/chromeless widgets
			*/
			
			$('link[rel="stylesheet"][href*="r4d.css"]').remove();
			$('link[rel="stylesheet"][href*="r4d_chromeless.css"]').remove();		
			$('.demowidget').show('slow');	
			$('.load').show('slow');
			$('#demowidget').hide();			
			$('#scriptarea').empty();
			createDemo(projectID, chromeless, host);
		} else { // if project ID isn't a valid number hide/keep things hidden and show error message
			$('.demowidget').hide();
			$('.load').hide();
			$('.code').hide();
			$('#warningTxt').show('slow');
			$('#clickcopy').zclip('remove'); //remove zclip to prevent un-wanted behaviour
		}
	});
})();
