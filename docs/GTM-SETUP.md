# Google Tag Manager Setup

**GTM Container ID:** `GTM-W9NMCLFN`

## Head Script (place as high as possible in `<head>`)

```html
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-W9NMCLFN');</script>
<!-- End Google Tag Manager -->
```

## Body Script (place immediately after opening `<body>` tag)

```html
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-W9NMCLFN"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
```

## Implementation Location

These scripts are implemented in:
- [src/layouts/BaseLayout.astro](../src/layouts/BaseLayout.astro)

The head script uses `is:inline` directive in Astro to prevent bundling/optimization.

## Verification

To verify GTM is working:
1. Install the [Tag Assistant](https://tagassistant.google.com/) Chrome extension
2. Visit any page on the site
3. Check that GTM-W9NMCLFN loads successfully
