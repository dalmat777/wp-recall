
Rcl.Cart = {
    products_amount:0,
    order_price:0,
    products: new Array
};

Rcl.Variations = new Array;

function rcl_init_product_slider(gallery_id){
    jQuery('.rcl-product-gallery #'+gallery_id).bxSlider({pagerCustom: '.product-slider-pager'});
}

function rcl_init_variations(varsData){

    var box_id = varsData.box_id;
    var variations = varsData.variations;
    var product_id = varsData.box_id;
    var product_price = varsData.product_price;

    Rcl.Variations[product_id] = new Array;
    
    variations.forEach(function(variation, i, variations) {

        var varSlug = variation.slug;
        var varValues = variation.values;
        
        var i = Rcl.Variations[product_id].length;
        Rcl.Variations[product_id][i] = {
            slug: varSlug,
            price: 0
        };
        
        jQuery('#cart-box-'+box_id).find('input[name="cart[variations]['+varSlug+']"]:checked, input[name="cart[variations]['+varSlug+'][]"]:checked, select[name="cart[variations]['+varSlug+']"]').each(function(){
            
            var loopData = {
                input: jQuery(this),
                varValues: varValues,
                varSlug: varSlug,
                product_id: product_id,
                product_price: product_price
            };
            
            Rcl.Variations[product_id] = rcl_variations_loop(loopData);

        });
        
        jQuery('#cart-box-'+box_id+' input[name="cart[variations]['+varSlug+']"], #cart-box-'+box_id+' input[name="cart[variations]['+varSlug+'][]"], #cart-box-'+box_id+' select[name="cart[variations]['+varSlug+']"]').change(function(){
        
            var loopData = {
                input: jQuery(this),
                varValues: varValues,
                varSlug: varSlug,
                product_id: product_id,
                product_price: product_price
            };
            
            Rcl.Variations[product_id] = rcl_variations_loop(loopData);

        });

    });

}

function rcl_variations_loop(loopData){
    
    var input = loopData.input;
    var varValues = loopData.varValues;
    var varSlug = loopData.varSlug;
    var product_id = loopData.product_id;
    var product_price = loopData.product_price;

    var type = input.attr('type');

    if(!type)
        type = 'select';

    var currentVal = input.val();
    var cartBox = input.parents('.rcl-cart-box');
    var priceBox = cartBox.find('.current-price');

    varValues.forEach(function(varVal, i, varValues) {

        if(!varVal || currentVal != varVal.name) return;

        var varPrice = parseInt(varVal.price);

        if(!varPrice) varPrice = 0;

        var variations = Rcl.Variations[product_id];

        variations.forEach(function(val, i, variations) {

            if(varSlug != val.slug) return;

            if(type == 'checkbox'){
                if(input.attr('checked') == 'checked'){
                    Rcl.Variations[product_id][i].price += varPrice;
                }else{
                    Rcl.Variations[product_id][i].price -= varPrice;
                }
            }else{
                Rcl.Variations[product_id][i].price = varPrice;
            }

        });

    });
    
    priceBox.text(product_price + rcl_get_variations_price(product_id));
    
    return Rcl.Variations[product_id];
    
}

function rcl_get_variations_price(product_id){

    var variations = Rcl.Variations[product_id];
    
    var varsPrice = 0;

    variations.forEach(function(value, i, variations) {

        varsPrice += value.price;

    });
    
    return varsPrice;
    
}

rcl_add_action('rcl_init','rcl_init_cart');
function rcl_init_cart(){
    
    if(jQuery.cookie('rcl_cart')){
        
        var products = JSON.parse(jQuery.cookie('rcl_cart'));
        
        rcl_cart_setup_data(products);
        
    }
}

function rcl_cart_setup_data(products){
    
    Rcl.Cart.products = products;

    products.forEach(function(product, i, products) {
        
        if(!product) return;

        Rcl.Cart.products_amount += product.product_amount;
        Rcl.Cart.order_price += product.product_amount * product.product_price;

    });
    
}

function rcl_cart_update_data(products){

    Rcl.Cart = {
        products_amount:0,
        order_price:0,
        products: new Array
    };
    
    var k = 0;

    products.forEach(function(product, i, products) {
        
        if(product){

            Rcl.Cart.products[k] = product;
            Rcl.Cart.products_amount += parseInt(product.product_amount);

            if(product.product_price)
                Rcl.Cart.order_price += product.product_amount * product.product_price;
            
            k++;
        
        }

    });
    
    jQuery.cookie('rcl_cart', JSON.stringify(Rcl.Cart.products),{path:'/'});
}

function rcl_search_product(product_id){
    
    var products = Rcl.Cart.products;
    
    var key = false;
    
    products.forEach(function(product, i, products) {
        
        if(!product) return;
        
        if(product.product_id == product_id){
            key = i;
            return;
        }

    });
    
    return key;
    
}

function rcl_update_cart_content(){
    
    rcl_preloader_show(jQuery('#rcl-order'));
    
    var dataString = 'action=rcl_update_cart_content&cart='+JSON.stringify(Rcl.Cart.products);
        dataString += '&ajax_nonce='+Rcl.nonce;
    
    jQuery.ajax({
        type: 'POST', data: dataString, dataType: 'json', url: Rcl.ajaxurl,
        success: function(data){
            
            rcl_preloader_hide();

            if(data['error']){
                rcl_notice(data['error'],'error',10000);
                return false;
            }

            if(data['success']){
                
                jQuery('#rcl-order').html(data['content']);

            }

        }
    });
    
}

function rcl_cart_add_product(product_id, key){
    
    var productBox = jQuery('#product-'+product_id+'-'+key);
    
    if(key === null)
        var key = rcl_search_product(product_id);
    
    if(key === false) return false;
    
    var product = Rcl.Cart.products[key];
    
    product.product_amount++;

    var product_sum = product.product_amount * product.product_price;

    Rcl.Cart.products[key] = product;
    
    rcl_cart_update_data(Rcl.Cart.products);
    
    productBox.find('.product-amount').text(product.product_amount);
    productBox.find('.product-sumprice').text(product_sum);
    
    jQuery('.rcl-order-price').html(Rcl.Cart.order_price);
    jQuery('.rcl-order-amount').html(Rcl.Cart.products_amount);
    
    //rcl_update_cart_content();

    return false;
}

function rcl_cart_remove_product(product_id, key){ 
    
    var productBox = jQuery('#product-'+product_id+'-'+key);
    
    if(key === null)
        var key = rcl_search_product(product_id);
    
    if(key === false) return false;
    
    var product = Rcl.Cart.products[key];
    
    product.product_amount--;
    
    if(product.product_amount <= 0){
        
        delete Rcl.Cart.products[key];

        //productBox.remove();
        
        /*var products = Rcl.Cart.products;

        if(products.length == 1){
            jQuery('#rcl-order').html('Ваша корзина пуста.');
        }*/
        
        rcl_cart_update_data(Rcl.Cart.products);
        
        rcl_update_cart_content();
        
        return false;

    }else{
        
        var product_sum = product.product_amount * product.product_price;

        Rcl.Cart.products[key] = product;
        
    }

    rcl_cart_update_data(Rcl.Cart.products);
    
    productBox.find('.product-amount').text(product.product_amount);
    productBox.find('.product-sumprice').text(product_sum);
    
    jQuery('.rcl-order-price').html(Rcl.Cart.order_price);
    jQuery('.rcl-order-amount').html(Rcl.Cart.products_amount);

    return false;
}

function rcl_add_to_cart(e){
    
    var box = jQuery(e).parents('.rcl-cart-box');
    
    var product_id = jQuery(e).parents('.rcl-cart-form').data('product');
    
    var formData = box.find('form').serialize();
    
    if(jQuery('#product-'+product_id).size()){
        rcl_preloader_show(jQuery('#product-'+product_id));
    }else{
        rcl_preloader_show(box);
    }

    var dataString = 'action=rcl_add_to_cart&'+formData;
    
    dataString += '&ajax_nonce='+Rcl.nonce;
    
    jQuery.ajax({
        type: 'POST', data: dataString, dataType: 'json', url: Rcl.ajaxurl,
        success: function(data){
            
            rcl_preloader_hide();
            
            if(data.modal){
                
                if(jQuery('#ssi-modalContent').size()) ssi_modal.close();
                    
                ssi_modal.show({
                    className: 'rcl-dialog-tab product-dialog',
                    sizeClass: 'auto',
                    buttons: [{
                        label: Rcl.local.close,
                        closeAfter: true
                    }],
                    beforeClose:function(modal){
                        /*rcl_init_variations(Rcl.VariationsData);*/
                    },
                    content: data.content
                });
                
                return;
                
            }

            if(data.error){
                rcl_notice(data.error,'error',10000);
                return false;
            }

            if(data.success){
                
                rcl_close_notice('#rcl-notice > div');
                rcl_notice(data.success,'success');
                
                jQuery('.rcl-mini-cart').removeClass('empty-cart');
                jQuery('.rcl-order-price').html(data.cart.order_price);
                jQuery('.rcl-order-amount').html(data.cart.products_amount);

                jQuery('.rcl-order-price').html(data.cart.order_price);
                jQuery('.rcl-order-amount').html(data.cart.products_amount);

                Rcl.Cart = data.cart;
                
                jQuery.cookie('rcl_cart', JSON.stringify(data.cart.products),{path:'/'});

            }

        }
    });
    
    return false;
    
}

function rcl_add_product_quantity(e){
    
    var selector = jQuery(e).parents('.quantity-selector');
    var input = selector.find('input');
    
    var value = parseInt(input.val()) + 1;
    
    input.val(value);
}

function rcl_remove_product_quantity(e){
    
    var selector = jQuery(e).parents('.quantity-selector');
    var input = selector.find('input');
    
    var value = parseInt(input.val()) - 1;
    
    if(!value) return false;
    
    input.val(value);
}

function rcl_cart_submit(){
    
    rcl_preloader_show(jQuery('#rcl-order'));
    
    if(!rcl_cart_check_required()){
        
        rcl_preloader_hide();
        
        return false;
    }
    
    var form = jQuery('#rcl-order-form');
    
    var formData = form.serialize();
    
    var dataString = 'action=rcl_check_cart_data&'+formData;
    
    dataString += '&ajax_nonce='+Rcl.nonce;
    
    jQuery.ajax({
        type: 'POST', data: dataString, dataType: 'json', url: Rcl.ajaxurl,
        success: function(data){

            if(data.error){
                
                rcl_preloader_hide();
                
                rcl_notice(data.error,'error',10000);
                
                return false;
            }

            if(data.success){
                
                rcl_do_action('rcl_cart_submit');
        
                form.submit();

            }

        }
    });
    
}

function rcl_cart_check_required(){
    
    var required = true;
    var requireds = new Array;
    var form = jQuery('#rcl-order-form');
    
    form.find(':required').each(function(){
        var i = requireds.length;
        requireds[i] = jQuery(this).attr('name');
    });

    requireds.forEach(function(name, i, requireds) {

        var field = form.find('[name="'+name+'"]');
        var type = field.attr('type');
        var value = false;

        if(type=='checkbox'){
            if(field.is(":checked")){
                value = true;
                field.next('label').css('box-shadow','none');
            }else {
                field.next('label').css('box-shadow','red 0px 0px 5px 1px inset');
            }
        }else{
            if(field.val()) value = true;
        }

        if(!value){
            field.css('box-shadow','red 0px 0px 5px 1px inset');
            required = false;
        }else{
            field.css('box-shadow','none');
        }

    });

    if(!required){
        rcl_notice(Rcl.local.requared_fields_empty,'error',10000);
        return false;
    }
    
    return true;
    
}

rcl_add_action('rcl_pay_order_user_balance','rcl_pay_order_with_balance');
function rcl_pay_order_with_balance(data){

    if(data.pay_balance){
        
        rcl_notice(data.success,'success');
        
        var orderBox = jQuery('#rcl-order');
        
        orderBox.find('.rcl-order-pay-form').html(data.success);

    }
    
}

/*jQuery(function(){
    
    jQuery('#rcl-order').on('click','.confirm_order',function(){
        
        var dataString = 'action=rcl_confirm_order&'+jQuery('#rcl-order').serialize();
        dataString += '&ajax_nonce='+Rcl.nonce;
        
        rcl_preloader_show(jQuery('#rcl-order'));
        
        jQuery.ajax({
            type: 'POST',
            data: dataString,
            dataType: 'json',
            url: Rcl.ajaxurl,
            success: function(data){
                rcl_preloader_hide();

                if(data.errors){
                    jQuery.each(data.errors, function( index, value ) {
                        rcl_notice(value,'error',10000);
                    });

                    if(data['code']==10){
                        jQuery('#rcl-order-notice').html(data['html']);
                    }

                    return false;
                }

                jQuery('#rcl-order-notice').html(data['success']);
                jQuery('#rcl-order .rcl-order-fields').remove();
                jQuery('#rcl-order a.edit-num').remove();
                jQuery('#rcl-order .add_remove').empty();

            }
        });
        
        return false;
        
    });
    
});*/

/* Удаляем заказ пользователя в корзину */
/*function rcl_trash_order(e,data){       
    jQuery('#manage-order, table.order-data').remove();
    jQuery('#rcl-order-notice').html(data.result);
}*/

/* Увеличиваем количество товара в большой корзине */
/*function rcl_cart_add_product(e){
    rcl_preloader_show('#cart-form > table');
    var id_post = jQuery(e).parent().data('product');
    var number = 1;
    var dataString = 'action=rcl_add_cart&id_post='+ id_post+'&number='+ number;
    dataString += '&ajax_nonce='+Rcl.nonce;
    jQuery.ajax({
    type: 'POST', data: dataString, dataType: 'json', url: Rcl.ajaxurl,
    success: function(data){
        rcl_preloader_hide();
        
        if(data['error']){
            rcl_notice(data['error'],'error',10000);
            return false;
        }
        
        if(data['recall']==100){
            jQuery('.cart-summa').text(data['data_sumprice']);
            jQuery('#product-'+data['id_prod']+' .sumprice-product').text(data['sumproduct']);
            jQuery('#product-'+data['id_prod']+' .number-product').text(data['num_product']);
            jQuery('.cart-numbers').text(data['allprod']);
        }
        
    }
    });
    return false;
}*/

/* Уменьшаем товар количество товара в большой корзине */
/*function rcl_cart_remove_product(e){
    rcl_preloader_show('#cart-form > table');
    var id_post = jQuery(e).parent().data('product');
    var number = 1;
    if(number>0){
        var dataString = 'action=rcl_remove_product_cart&id_post='+ id_post+'&number='+ number;
        dataString += '&ajax_nonce='+Rcl.nonce;
        jQuery.ajax({
            type: 'POST', data: dataString, dataType: 'json', url: Rcl.ajaxurl,
            success: function(data){
                rcl_preloader_hide();

                if(data['error']){
                    rcl_notice(data['error'],'error',10000);
                    return false;
                }

                if(data['recall']==100){
                    jQuery('.cart-summa').text(data['data_sumprice']);
                    jQuery('#product-'+data['id_prod']+' .sumprice-product').text(data['sumproduct']);

                    var numprod = data['num_product'];
                    if(numprod>0){
                        jQuery('#product-'+data['id_prod']+' .number-product').text(data['num_product']);
                    }else{
                        var numberproduct = 0;
                        jQuery('#product-'+data['id_prod']).remove();
                    }
                    if(data['allprod']==0) jQuery('.confirm').remove();

                    jQuery('.cart-numbers').text(data['allprod']);
                }

            }
        });
    }
    return false;
}*/

/* Кладем товар в малую корзину */
/*function rcl_add_cart(e){            
    var id_post = jQuery(e).data('product');
    rcl_preloader_show('#product-'+id_post+' > div');
    var id_custom_prod = jQuery(e).attr('name');
    if(id_custom_prod){
        var number = jQuery('#number-custom-product-'+id_custom_prod).val();
    }else{
        var number = jQuery('#number_product').val();
    }
    var dataString = 'action=rcl_add_minicart&id_post='+id_post+'&number='+number+'&custom='+id_custom_prod;
    dataString += '&ajax_nonce='+Rcl.nonce;
    jQuery.ajax({
        type: 'POST', data: dataString, dataType: 'json', url: Rcl.ajaxurl,
        success: function(data){
            rcl_preloader_hide();

            if(data['error']){
                rcl_notice(data['error'],'error',10000);
                return false;
            }

            if(data['recall']==100){
                rcl_close_notice('#rcl-notice > div');
                jQuery('.empty-basket').replaceWith(data['empty-content']);
                jQuery('.cart-summa').html(data['data_sumprice']);
                jQuery('.cart-numbers').html(data['allprod']);
                rcl_notice(data['success'],'success');
            }

        }
    });
    return false;
}*/

//получаем и обрабатываем данные полученные после оплаты заказа
/*rcl_add_action('rcl_pay_order_user_balance','rmag_pay_order_with_balance');
function rmag_pay_order_with_balance(data){

    if(data['otvet']==100){
        jQuery('.order_block').find('.pay_order').each(function() {
                if(jQuery(e).attr('name')==data['idorder']) jQuery(e).remove();
        });
        jQuery('#rcl-order-notice').html(data['recall']);
        jQuery('.usercount').html(data['count']);
        jQuery('.order-'+data['idorder']+' .remove_order').remove();
        jQuery('#manage-order').remove();
    }
    
}*/