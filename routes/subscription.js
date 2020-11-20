const { default: Axios } = require("axios");
const express = require("express");
const router = express.Router();
const {
  ensureAuthenticated,
  // ensureAuthorized,
  // forwardAuthenticated,
} = require("../middlewares/auth");
const { Subscription } = require("../models/subscription");
const { User } = require("../models/users");
const PAYSTACK_BASE_URL = process.env.PAYSTACK_BASE_URL;

const getUserSubscriptionData = async (customerId, planId) => {
  console.log({ customerId, planId });
  let response = await Axios.get(PAYSTACK_BASE_URL + "/subscription", {
    params: {
      customer: customerId,
      plan: planId,
      perPage: 100,
    },
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    },
  });
  let subscriptions = response.data.data;
  return subscriptions[0];
};

router.post("/cancel", ensureAuthenticated, async (req, res, next) => {
  const userId = req.userId;
  try {
    const subscription = await Subscription.findOne({ user_id: userId });

    //check if subscription exist
    if (subscription) {
      let response = await Axios.get(
        PAYSTACK_BASE_URL + "/subscription/" + subscription.code,
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          },
        }
      );
      let sub = response.data.data;
      // Cancel subscription

      response = await Axios.post(
        PAYSTACK_BASE_URL + "/subscription/disable",
        {
          code: sub.subscription_code,
          token: sub.email_token,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          },
        }
      );
      let cancel = response.data;

      if (cancel.status) {
        await subscription.update({
          status: "CANCELLED",
        });
      }
      return res.status(200).json(cancel);
    } else {
      // else return subscribed false
      return res.status(200).json({
        message: "You're not subscribed yet",
        data: {
          subscribed: false,
        },
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      message: (error.response && error.response.data.message) || error.message,
    });
  }
});

router.get("/verify", ensureAuthenticated, async (req, res, next) => {
  const userId = req.userId;
  const now = new Date();
  //   now.setFullYear(now.getFullYear() + 1);
  try {
    let subscription = await Subscription.findOne({ user_id: userId });

    //check if subscription exist
    if (subscription) {
      // If it's a processing subscription
      if (subscription.status === "PROCESSING") {
        let response = await Axios.get(
          PAYSTACK_BASE_URL + "/transaction/verify/" + subscription.reference,
          {
            headers: {
              Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            },
          }
        );
        let verification = response.data.data;
        let verified = verification.status;
        switch (verified) {
          case "success":
            let tx_date = new Date(verification.transaction_date);
            let expires = null;

            if (subscription.duration === "monthly") {
              expires = tx_date.setMonth(tx_date.getMonth() + 1);
            }
            if (subscription.duration === "annually") {
              expires = tx_date.setFullYear(tx_date.getFullYear() + 1);
            }

            const subData = await getUserSubscriptionData(
              verification.customer.id,
              subscription.plan_id
            );
            // return res.send(subData);
            await subscription.update({
              status: "ACTIVE",
              expires,
              code: subData.subscription_code,
            });
            subscription = await Subscription.findOne({ user_id: userId });
            const user = await User.findById(userId);
            await user.update({
              subscription: subscription.duration,
            });

            return res.status(200).json({
              message: "success",
              data: {
                ...subscription.toObject(),
                subscribed: true,
              },
            });
          case "failed":
            return res.status(200).json({
              message: "Payment Failed",
              data: {
                subscribed: false,
              },
            });
          default:
            return res.status(200).json({
              message: verification.gateway_response,
              data: {
                subscribed: false,
              },
            });
        }
      }
      // If it's expired
      if (subscription.status === "EXPIRED") {
        const user = await User.findById(userId);
        await user.update({
          subscription: "free",
        });
        return res.status(200).json({
          message: "Your Subscription has Expired",
          data: {
            subscribed: false,
          },
        });
      }

      // If it's cancelled and has expired
      if (
        subscription.status === "CANCELLED" &&
        now > new Date(subscription.expires)
      ) {
        const user = await User.findById(userId);
        await user.update({
          subscription: "free",
        });
        await subscription.update({
          status: "EXPIRED",
        });
        return res.status(200).json({
          message: "Your Subscription has Expired",
          data: {
            subscribed: false,
          },
        });
      }

      //   if date is ahead of subscription date
      if (now > new Date(subscription.expires)) {
        // Check if renewed
        let response = await Axios.get(
          PAYSTACK_BASE_URL + "/subscription/" + subscription.code,
          {
            headers: {
              Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            },
          }
        );
        let renewal = response.data.data;
        if (renewal.status === "active") {
          let expires = new Date(renewal.next_payment_date);
          const subData = await getUserSubscriptionData(
            renewal.customer.id,
            subscription.plan_id
          );
          await subscription.update({
            status: "ACTIVE",
            expires,
            code: subData[0].subscription_code,
          });
          subscription = await Subscription.findOne({ user_id: userId });
          return res.status(200).json({
            message: "Your Subscription has been renewed",
            data: {
              ...subscription.toObject(),
              subscribed: true,
            },
          });
        } else {
          // Not renewed
          await subscription.update({
            status: "EXPIRED",
          });
          const user = await User.findById(userId);
          await user.update({
            subscription: "free",
          });
          return res.status(200).json({
            message: "Your Subscription has Expired",
            data: {
              subscribed: false,
            },
          });
        }
      }

      return res.status(200).json({
        message: "success",
        data: {
          ...subscription.toObject(),
          subscribed: true,
        },
      });
    } else {
      // else return subscribed false
      return res.status(200).json({
        message: "You're not subscribed yet",
        data: {
          subscribed: false,
        },
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      message: (error.response && error.response.data.message) || error.message,
    });
  }
});

router.post("/subscribe", ensureAuthenticated, async (req, res, next) => {
  const userId = req.userId;
  const { interval } = req.body;
  const now = new Date();

  if (!["monthly", "annually"].includes(interval)) {
    return res.status(400).json({
      message: "interval must be 'monthly or 'annually'",
    });
  }

  const planName = interval + "-plan";

  try {
    //   Get sub plan
    let response = await Axios.get(PAYSTACK_BASE_URL + "/plan", {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    });

    const plans = response.data.data;
    const planExists = plans.find((plan) => plan.name === planName);

    //   if sub plan then create subcription
    if (planExists) {
      /*  Log Processing Subscription */
      // Check if existing sub
      const subExists = await Subscription.findOne({ user_id: req.userId });

      //   if sub active ask to upgrade
      if (subExists && subExists.status === "ACTIVE") {
        return res.status(400).json({
          message:
            "You are subscribe already, you can only try to upgrade, downgrade or cancel your subscription",
        });
      }

      if (subExists && now < new Date(subExists.expires)) {
        return res.status(400).json({
          message:
            "Your current subscription will be active till " +
            subExists.expires,
        });
      }

      //    else make subscription
      const tx = {
        email: req.user.email,
        plan: planExists.plan_code,
        callback_url: process.env.PAYSTACK_CALLBACK_URL,
      };

      response = await Axios.post(
        PAYSTACK_BASE_URL + "/transaction/initialize",
        tx,
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          },
        }
      );
      const transaction = response.data.data;

      console.log({ transaction });

      if (subExists && subExists.status !== "ACTIVE") {
        await subExists.update({
          plan: planName,
          duration: interval,
          plan_id: planExists.id,
          reference: transaction.reference,
          amount: planExists.amount,
          status: "PROCESSING",
        });
        subExists.save();
      } else {
        await Subscription.create({
          user_id: userId,
          plan: planName,
          plan_id: planExists.id,
          duration: interval,
          amount: planExists.amount,
          reference: transaction.reference,
        });
      }

      return res.status(200).json({
        message: "success",
        data: {
          url: transaction.authorization_url,
          reference: transaction.reference,
          callback_url: process.env.PAYSTACK_CALLBACK_URL,
        },
      });
    }
    // else Nothing
    return res.status(404).json({
      message: "Plan not found, contact admin.",
    });
  } catch (error) {
    return res.status(400).json({
      message: (error.response && error.response.data.message) || error.message,
    });
  }
});

router.post("/plan", ensureAuthenticated, async (req, res, next) => {
  let { interval, amount } = req.body;

  if (!["monthly", "annually"].includes(interval)) {
    return res.status(400).json({
      message: "interval must be 'monthly or 'annually'",
    });
  }

  if (amount * 100 < 5000) {
    return res.status(400).json({
      message: "amount must be greater than 50",
    });
  }

  const planName = interval + "-plan";
  amount = amount * 100;

  // check if sub plan exist
  try {
    let response = await Axios.get(PAYSTACK_BASE_URL + "/plan", {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    });
    const plans = response.data.data;

    const planExists = plans.find((plan) => plan.name === planName);

    //   if exist update amount
    console.log({ planExists });
    if (planExists) {
      response = await Axios.put(
        PAYSTACK_BASE_URL + "/plan/" + planExists.plan_code,
        {
          amount,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          },
        }
      );
      const plan = response.data;
      return res.json({
        message: "success",
      });
    } else {
      // else create sub plan
      response = await Axios.post(
        PAYSTACK_BASE_URL + "/plan",
        {
          name: planName,
          interval,
          amount,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          },
        }
      );

      const plan = response.data.data;

      return res.json({
        message: "success",
        data: plan,
      });
    }
  } catch (error) {
    return res.status(400).json({
      message: error.response.data,
    });
  }
});

router.get("/plan", ensureAuthenticated, async (req, res, next) => {
  try {
    let response = await Axios.get(PAYSTACK_BASE_URL + "/plan", {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    });
    const plans = response.data.data;

    return res.json({
      message: "success",
      data: plans,
    });
  } catch (error) {
    return res.status(400).json({
      message: error.response.data,
    });
  }
});

module.exports = router;
