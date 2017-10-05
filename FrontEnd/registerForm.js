function openForm(evt, formType){
	var tabContent, tabLink, i;

	/*Hide forms */
	tabContent = document.getElementsByClassName("tabContent");
	for(i=0; i<tabContent.length; i++){
		tabContent[i].style.display="none";
	}

	tabLink = document.getElementsByClassName("tabLink");
	for (i=0; i<tabLink.length; i++){
		tabLink[i].className=tabLink[i].className.replace("active","");
	}

	document.getElementById(formType).style.display="block";
	evt.currentTarget.className += "active";
}
