import Joi from 'joi'
import { metric } from '../text-formatters.js'
import { BaseJsonService, InvalidParameter } from '../index.js'

const lemmyCommunitySchema = Joi.object({
  community_view: Joi.object({
    counts: Joi.object({
      subscribers: Joi.number().required(),
    }).required(),
  }).required(),
}).required()

export default class Lemmy extends BaseJsonService {
  static category = 'social'

  static route = {
    base: 'lemmy',
    pattern: ':community',
  }

  static examples = [
    {
      title: 'Lemmy',
      namedParams: { community: 'asklemmy@lemmy.ml' },
      staticPreview: this.render({
        community: 'asklemmy@lemmy.ml',
        members: 42,
      }),
    },
  ]

  static defaultBadgeData = { label: 'community' }

  static render({ community, members }) {
    return {
      label: `subscribe to ${community}`,
      message: metric(members),
      color: 'brightgreen',
    }
  }

  async fetch({ community }) {
    const splitAlias = community.split('@')
    // The community will be in the format of `community@server`
    if (splitAlias.length !== 2) {
      throw new InvalidParameter({
        prettyMessage: 'invalid community',
      })
    }

    const host = splitAlias[1]

    const data = await this._requestJson({
      url: `https://${host}/api/v3/community`,
      schema: lemmyCommunitySchema,
      options: {
        searchParams: {
          name: community,
        },
      },
      httpErrors: {
        404: 'community not found',
      },
    })
    return data.community_view.counts.subscribers
  }

  async handle({ community }) {
    const members = await this.fetch({ community })
    return this.constructor.render({ community, members })
  }
}
