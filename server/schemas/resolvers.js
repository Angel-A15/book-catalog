const { AuthenticationError } = require('apollo-server-express');
const { User, Thought } = require('../models');
const { signToken } = require('../utils/auth');



const resolvers = {
    Query: {
        me: async (parent, args, context) => {
        if (context.user) {
            const userData = await User.findOne({ _id: context.user._id })
                .select('-__v - password');
            return userData;
        }

        throw new AuthenticationError('Not logged in');
        },

    },
    Mutation: {
        login: async (parent, { email, password }) => {
            const User = await User.findOne({ email });
            // user and it's credential's validation.
            if (!User) {
                throw new AuthenticationError('invalid login credentials.');
            }
            // password validation
            const correctPw = await User.isCorrectPassword(password);
            if (!correctPw) {
                throw new AuthenticationError('Invalid login credentials.');
            }
            const token = signToken(User);
            return { token, User };
        },
        addUser: async (parent, args) => {
            const User = await User.create(args);
            const token = signToken(User);
            return { token, User };
        },
        saveBook: async (parent, context, { input }) => {
            if (context.User) {
                const updatedUser = await User.findOneAndUpdate(
                    { _id: context.User._id },
                    { $addToSet:{ savedBooks: input} },
                    { new: true, runValidators: true }
                );
                return updatedUser;
            }
            throw new AuthenticationError('Please login and try again!');
        },
        removeBook: async (parent, context, args) => {
            if (context.User) {
                const updatedUser = await User.findOneAndUpdate(
                    { _id: context.User._id },
                    { $pull: { savedBooks: { bookId: args.bookId } } },
                    { new: true }
                );
                return updatedUser;
            }
            throw new AuthenticationError('Please login and try again!')
        },
    },
};

module.exports = resolvers;