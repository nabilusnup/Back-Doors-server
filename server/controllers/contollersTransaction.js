const {User, Room, Transaction, IdentityUser} = require("../models/index")
const midtransClient = require('midtrans-client');
const {sendEmail} =require("../helpers/nodemailer")

class Controller {
    static async AddTransaction(req, res, next){
        try {
            let RoomId = req.params.room;
            let UserId = req.user.id;
            let room = await Room.findByPk(RoomId);
            if (!room) {
              throw { name: "NotFound" };
            }
      
            let checked = await Transaction.findOne({
              where: { UserId, RoomId, status: 'Unpaid' },
            });
            if (checked) {
              throw { name: "AlreadyExists" };
            }
      
            let data = await Transaction.create({
              UserId,
              RoomId,
            });
            let transaction = { data, room };
            res.status(201).json({ transaction });
          } catch (error) {
            next(error);
          }
      }

      static async fetchDataTransactions(req, res, next){
        try {
          let id = req.user.id
          let data = await Transaction.findAll({
            where: {UserId : id},
            include: ['Room', 'IdentityUser']
          })
          res.status(200).json(data)
        } catch (error) {
          console.log(error);
        }
      }

      static async handleStatus(req, res, next){
        try {
            let id = req.params.id;
            console.log(id);
            let find = await Transaction.findByPk(id)
            if (!find){
              throw ({name : "NotFound"})
            }
            await Transaction.update({
              status : "Paid"
            }, {where : {id}})
            res.status(200).json({message : "success payment"});
          } catch (error) {
            next(error);
          }
      }

      static async createTokenMidtrans(req, res, next){
        try {
          const id = +req.user.id;
          const email = req.user.email
          const price = +req.params.price;

          let snap = new midtransClient.Snap({
            isProduction : false,
            serverKey : process.env.MIDTRANS_SERVER_KEY
        });

        const user = await User.findByPk(id);

        let parameter = {
          transaction_details: {
              order_id: "BlackDoorz_Transaction" + Math.floor(1000000 + Math.random()*9999999),
              gross_amount: price,
          },
          credit_card:{
              secure : true
          },
          customer_details: {
              email: user.email,
          }
      };
      const midtransToken = await snap.createTransaction(parameter);
      sendEmail(email, price)
      res.status(201).json(midtransToken);
        } catch (error) {
          next(error)
        }
      }

      static async handleIdentity(req, res, next){
        try {
            let TransactionId = req.params.id
            let {phoneNumber} = req.body
            let imgUrl = req.file.path 
            let data = await IdentityUser.create({
              image : imgUrl,
              phoneNumber,
              TransactionId
            })
            res.status(201).json(data)
        } catch (error) {
            next(error)
        }
      }
}

module.exports = Controller
