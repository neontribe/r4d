var widgetTemplate,
	minifiedWidget; //global variable holding the template for the widget

//run these commands when the javascript loads
(function onload(){
	$('#warningTxt').hide(); //hide elements that aren't meant to show on script load. 
	$('textarea').hide();
	$('#demowidget').hide();
	$('div.b').hide();
	widgetTemplate = //properly formatted template
		"<script data-r4dw-project_id='{ID}' data-r4dw-chromeless='{CHROME}'>" +
		"\n\t(function() {" + 
		"\n\t\tvar script = document.createElement('script');" + 
		"\n\t\tscript.type = 'text/javascript';"+
		"\n\t\tscript.async = true;" + 
		"\n\t\tscript.src = '{HOST}/widgets/r4d.js';" +
		"\n\t\tvar entry = document.getElementsByTagName('script')[0];" +
		"\n\t\tentry.parentNode.insertBefore(script, entry);"+	
		"\n\t}());" +
		"\n</script>";
	minifiedWidget = "(function() {var script = document.createElement('script');script.type = 'text/javascript';script.async = true;script.src = '{HOST}/widgets/r4d.js';var entry = document.getElementsByTagName('script')[0];entry.parentNode.insertBefore(script, entry);}());";
})();

function template(src, data){
	//console.log(swap.length);
	$.each(data, function(k,v){
		src = src.split("{" + k + "}").join(v);
	});
	return src;
}

$(document).on('focus', 'textarea', function(){ //function controlling what to do when the textarea gains focus
	$this=$(this);
	$this.select();
	$this.mouseup(function() { //fix for chrome's little problem
		//prevent further mousup intervention
		$this.unbind("mouseup");
		return false;
	});
});
$(document).on('submit', 'form', function(evt){ //function controlling the widget code generation
	//var declaration
	var projectID, 
		chromeless,
		url_parser = $('<a></a>').attr('href', document.URL),
		host,
		self = this;	
	
	evt.preventDefault(); //prevent default action upon submit
	projectID = $('input[type=text]', this).val(); // get the inputted project ID
	chromeless = ($('input[type=checkbox]', this).attr('checked')=="checked"); // get whether the chromeless checkbox is checked
	
	host = template("{protocol}//{host}", {"protocol":url_parser.prop('protocol'), "host":url_parser.prop('host')});

	if ($.isNumeric(projectID) && projectID == Math.round(projectID) && projectID > 0){ //check if projectID is a valid number
		$('p',this).hide('fast');
		$('.check', this).hide();
		$('textarea').hide('fast');
		$('div.b').hide('fast');
		//show/hide and re-colour elements. 
		$('#demowidget').show('slow', function(){
		    /**
		     * Manually remove any r4d styles from the page to work around 
		     * issues when regenerating chromed/chromeless widgets
		     */
			$('#loading').show();
			$('#scriptarea').hide();
			$('link[rel="stylesheet"][href*="r4d.css"]').remove();
		    $('link[rel="stylesheet"][href*="r4d_chromeless.css"]').remove();
			setTimeout("$('#loading').hide('slow')", 1000);
			setTimeout("$('#scriptarea').show('slow')", 1010);
			setTimeout("displayGeneratedCode()", 1500);
			setTimeout("applyzClip()",2000);
			$('#scriptarea').empty();
			document.getElementById('scriptarea').appendChild(createDemo(projectID, chromeless, host));
		});	
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
	} else { // if project ID isn't a valid number hide/keep things hidden and show error message
		$('#scriptarea').empty();
		$('div[class=b]',this).hide('fast');
		$('textarea',this).hide('fast');
		$('p',this).show('slow');
		$('#demowidget').hide('fast');
		$('#clickcopy').zclip('remove'); //remove zclip to prevent un-wanted behaviour
	}
});
function displayGeneratedCode(){
	$('div.b').css('background-color','#707070').show('slow');
	$('textarea').show('slow');
}
function createDemo(projectID, chromeless, host){
	var widget = document.createElement('script');
	widget.setAttribute('data-r4dw-project_id',projectID);
	widget.setAttribute('data-r4dw-chromeless',chromeless);
	widget.innerHTML=template(minifiedWidget, {"HOST": host});
	return widget;
}
function applyzClip(){
	$('div.b').zclip({								// the div needs to exist, on page load
		path:'js/ZeroClipboard.swf',
		copy:$('textarea').val(),
		afterCopy:function(){
			$(this).css('background-color','green');
			$('.check', this).show();
			$('#clickcopy').zclip('remove');
			applyzClip();
		}			
	});		
}
