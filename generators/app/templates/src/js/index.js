console.log(1)


//swiper
var swiper = new Swiper('.swiper-container', {
  pagination: '.swiper-pagination',
  paginationClickable: true
});

//接口请求
var apiUrl;
// @if NODE_ENV='production'
apiUrl = 'https://xxx.yyy.com/'; //生产接口地址
// @else
apiUrl = '/api/'; //本地开发接口地址，配合代理
// @endif

$.ajax({
  url: apiUrl + 'nocdn/apitest/index.php',
  type: 'get',
  success: function (e) {
    console.log(e)
  }
})

$(function () {
  let data = {
    name: 'friend'
  }
  const foo = () => {
    data = Object.assign(data, {
      age: '18'
    })
  }
  foo()
  var keys = Object.keys(data)
  console.log(keys)
})
