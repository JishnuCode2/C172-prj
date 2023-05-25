var uid = null;
AFRAME.registerComponent("marker-handler", {
    init: async function () {

      var toys = await this.getItems();
      var id = this.el.id;
  
      this.el.addEventListener("markerFound", () => {
        console.log("marker is found")
        this.handleMarkerFound(toys, id);
      });
  
      this.el.addEventListener("markerLost", () => {
        console.log("marker is lost")
        this.handleMarkerLost();
      });
    },

    askUserId: function(){
         swal({
            title: "Welcome to Toy Shop!!",
            icon: "none",
            content: {
              element: "input",
              attributes: {
                placeholder: "Type Your Customer Id",
                type: "number",
                min: 1
              }
            },
            closeOnClickOutside: false
        }).then(inputValue =>{
          return inputValue;
        })
    },

    handleMarkerFound: function (toys, id) {
      var toy = toys.filter(toy => toy.id === id)[0];
      if(toy.is_out_of_stock){
         swal({
          icon: "warning",
          title: toy.toy_name.toUpperCase(),
          text: `The Requested Toy - ${toy.toy_name} Is Currently Unavailable`,
          timer: 2500,
          button: false
         });
      }
      else{
        var model = document.querySelector(`#model-${toy.id}`);
        model.setAttribute("visible", true);
        
        var mainPlane = document.querySelector(`#main-plane-${toy.id}`);
        mainPlane.setAttribute("visible", true);

        var pricePlane = document.querySelector(`#main-plane-${toy.id}`);
        pricePlane.setAttribute("visible", true);

        var buttonDiv = document.getElementById("button-div");
        buttonDiv.style.display = "flex";
    
        var summaryButton = document.getElementById("rating-button");
        var orderButtton = document.getElementById("order-button");
        var orderSummaryButton = document.getElementById("order-summary-button");
        var payButton = document.getElementById("pay-button");
      
        summaryButton.addEventListener("click", function () {
          swal({
            icon: "warning",
            title: "Order Summary",
            text: "Work In Progress"
          });
        });
    
        orderButtton.addEventListener("click", () => {
          uid = this.askUserId();
          if(uid != null){
            var userId;
            uid <= 9 ? (userId = `U0${uid}`) : `U${uid}`
            this.handleOrder(userId, toy);
          }
          swal({
            icon: "https://i.imgur.com/4NZ6uLY.jpg",
            title: "Thanks For Order!",
            text: "Your order will soon be registered"
          });
        });

        orderSummaryButton.addEventListener("click", ()=>{
          this.handleOrderSummary()
        });

        payButton.addEventListener("click", ()=>{
          this.handlePayment()
        })
      }
    },

    handleOrderSummary: async function(){
      var userId;
      uid <= 9 ? (userId = `U0${uid}`) : `U${uid}`;

      var orderSummary = await this.getOrderSummary(userId);
      
      var modalDiv = document.getElementById("modal-div");
      modalDiv.style.display = "flex";

      var tableBodyTag = document.getElementById("bill-table-body");
      tableBodyTag.innerHTML = "";

      var currentOrders = Object.keys(orderSummary.current_orders);
      currentOrders.map(i =>{
        var tr = document.createElement("tr");

        var item = document.createElement("td");
        var price = document.createElement("td");
        var quantity = document.createElement("td");
        var subtotal = document.createElement("td");

        item.innerHTML = orderSummary.current_orders[i].item;

        price.innerHTML ="$" + orderSummary.current_orders[i].price;
        price.setAttribute("class", "text-center");

        quantity.innerHTML = orderSummary.current_orders[i].quantity;
        quantity.setAttribute("class", "text-center");

        subtotal.innerHTML = "$" + orderSummary.current_orders[i].subtotal;
        subtotal.setAttribute("class", "text-center");

        tr.appendChild(item);
        tr.appendChild(price);
        tr.appendChild(quantity);
        tr.appendChild(subtotal);

        tableBodyTag.appendChild(tr);
      });

      var totalTr = document.createElement("tr");

      var td1 = document.createElement("td")
      td1.setAttribute("class", "no-line");
      
      var td2 = document.createElement("td")
      td2.setAttribute("class", "no-line");

      var td3 = document.createElement("td")
      td3.setAttribute("class", "no-line text-center");

      var strongTag = document.createElement("strong");
      strongTag.innerHTML ="Total";
      td3.appendChild(strongTag);

      var td4 = document.createElement("td");
      td4.setAttribute("class", "no-line text-right");
      td4.innerHTML = "$" + orderSummary.total_bill;

      totalTr.appendChild(td1);
      totalTr.appendChild(td2);
      totalTr.appendChild(td3);
      totalTr.appendChild(td4);
      
      tableBodyTag.appendChild(totalTr);
    },

    getOrderSummary: async function(uid){
      return await firebase
        .firestore()
        .collection("users")
        .doc(uid)
        .get()
        .then(doc => doc.data())
    },

    handlePayment: function(){
      document.getElementById("modal-div").style.display = "none";

      var userId;
      uid <=9? (userId = `U0${userId}`): `U${userId}`
  
      firebase
        .firestore()
        .collection("users")
        .doc(userId)
        .update({
          current_orders: {},
          total_bill: 0
        })
        .then(()=>{
          swal({
            icon: "success",
            title: "Thanks For Paying!!",
            text: "We hope you enjoy your Order!!",
            timer: 2500,
            buttons: false
          })
        })
    },

    handleMarkerLost: function () {
      // Changing button div visibility
      var buttonDiv = document.getElementById("button-div");
      buttonDiv.style.display = "none";
    },

    getItems: async function(){
      return await firebase.firestore()
      .collection("toys")
      .get()
      .then(snap =>{
        return snap.docs.map(doc => doc.data());
      })
    },

    handleOrder: function(uid, toy){
      firebase.firestore()
        .collection("users")
        .doc(uid)
        .get()
        .then(doc => {
          var details = doc.data();
          if (details["current_orders"][toy.id]) {
            // Increasing Current Quantity
            details["current_orders"][toy.id]["quantity"] += 1;
            //Calculating Subtotal of item
            var currentQuantity = details["current_orders"][toy.id]["quantity"];
            details["current_orders"][toy.id]["subtotal"] = currentQuantity * toy.price;
          } else {
            details["current_orders"][toy.id] = {  
              item: toy.toy_name,
              price: toy.price,
              quantity: 1,
              subtotal: toy.price*1
            };
          };
          details.total_bill = toy.price;

          // Updating Db
          firebase
          .firestore()
          .collection("users").doc(doc.id)
          .update(details);
        });
    },
  
  });
  