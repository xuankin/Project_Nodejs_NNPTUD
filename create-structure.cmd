mkdir kinlong-phone-frontend
cd kinlong-phone-frontend

mkdir pages
mkdir pages\admin
mkdir partials
mkdir js
mkdir css
mkdir images

type nul > index.html

for %%f in (products.html product-detail.html cart.html checkout.html orders.html notifications.html profile.html login.html register.html forgot-password.html search.html) do type nul > pages\%%f

for %%f in (dashboard.html products.html orders.html users.html payments.html coupons.html categories.html reviews.html) do type nul > pages\admin\%%f

for %%f in (navbar.html footer.html) do type nul > partials\%%f

for %%f in (utils.js auth.js cart.js checkout.js reviews.js notifications.js admin.js main.js profile.js search.js coupons.js categories.js) do type nul > js\%%f

type nul > css\style.css
type nul > images\placeholder.jpg
