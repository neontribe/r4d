var widgetTemplate; //global variable holding the template for the widget

onload(); //run these commands when the javascript loads
function onload(){
	$('#clickcopy').hide('fast');
	$('textarea').hide('fast');
	$('#warningTxt').hide('fast'); //hide elements that aren't meant to show on script load. 
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
}
function template(src, data){
	//console.log(swap.length);
	$.each(data, function(k,v){
	    src = src.replace("{" + k + "}", v);
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
	chromeless = ($('input[type=checkbox]', this).attr('checked')=="checked"); // get whether the chromless checkbox is checked
	
	host = template("{protocol}//{host}", {protocol:url_parser.prop('protocol'), host:url_parser.prop('host')});

	if ($.isNumeric(projectID) && projectID == Math.round(projectID) && projectID > 0){ //check if projectID is a valid number
		$('p',this).hide('fast');
		$('.check', this).hide();
		$('textarea',this).show('slow');
		//show/hide and re-colour elements. 
		$('div.b',this).css('background-color','#707070').show('slow', function(){ 	//zclip attaches itself to the clickcopy div;
			$('div.b').zclip({								// the div needs to exist on page load
				path:'js/ZeroClipboard.swf',
				copy:$('textarea').val(),
				afterCopy:function(){
					$(this).css('background-color','green');
					$('.check', this).show();
				}				
			});
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
		$('div[class=b]',this).hide('fast');
		$('textarea',this).hide('fast');
		$('p',this).show('slow');
		$('#clickcopy').zclip('remove'); //remove zclip to prevent un-wanted behaviour
	}
});
