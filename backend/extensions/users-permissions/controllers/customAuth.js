const axios = require('axios')
const _ = require('lodash');
const { sanitizeEntity } = require('strapi-utils');
bcrypt = require('bcryptjs');

module.exports = async function customAuth (ctx, strapi, validate) {
  // const params = ctx.request.body;
  let user = null
  try {
		const u = { email, username, displayName, password } = await validate()

		user = await strapi.query('user', 'users-permissions').findOne({
			email
		});
    if (user) { // update info
      console.log(user)
      try {
        await strapi.query('user', 'users-permissions').update(
          { id: user.id},
          {
            ...u,
            password: await strapi.plugins['users-permissions'].services.user.hashPassword(
              u
            )
          }
        )
      } catch (error) {
        console.error(error)
      }
      
    } else if (!user) { // register
			return ctx.send((await axios.post(`http://${strapi.config.get('server.host')}:${strapi.config.get('server.port')}/auth/local/register`, {
				...u,
				blocked: false,
				confirmed: true
			})).data);
		}

    user = {...user, ...u}
    delete user.password

		const store = await strapi.store({
			environment: '',
			type: 'plugin',
			name: 'users-permissions',
		});

		if (
			_.get(await store.get({ key: 'advanced' }), 'email_confirmation') &&
			user.confirmed !== true
		) {
      throw new Error('Your account email is not confirmed')
			// return ctx.badRequest(
			// 	null,
			// 	formatError({
			// 		id: 'Auth.form.error.confirmed',
			// 		message: 'Your account email is not confirmed',
			// 	})
			// );
		}

		if (user.blocked === true) {
      throw new Error('Your account has been blocked by an administrator')
			// return ctx.badRequest(
			// 	null,
			// 	formatError({
			// 		id: 'Auth.form.error.blocked',
			// 		message: 'Your account has been blocked by an administrator',
			// 	})
			// );
		}
    return user
	} catch (error) {
		return
	}
	return
}