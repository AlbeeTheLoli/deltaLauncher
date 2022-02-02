<script lang="ts">
    export let blur_amount = 0;
    export let blur_opacity = 0;
    export let color = 0;
    export let src = '';
</script>

<div class="bg">
	<div style="opacity: {color}" class="color"></div>
	<div style="opacity: {blur_opacity}; --amount: {blur_amount}px" class="filter"></div>
	<div class="img">
		<img src={src} alt="bg"/>
		<video autoplay muted loop id="bg-video" src={src} alt=""></video>
	</div>
</div>