Title: Local GitHub repository backups with Python
Abstract: How to back up all your GitHub repositories to your local computer, using Python and the GitHub GraphQL API.
Published: 2020-07-01 08:14
Updated: 2020-07-01 08:14

This follows on from [my previous post about backing up GitHub repositories](/local-github-repository-backup-with-powershell.html). I wrote the original backup script in Powershell, but it had a couple of issues. The script only retrieved the first 100 repositories, so if you had more than 100 it wouldn't back them all up. Secondly, it would only work on repositories belonging to a _user_, not an organisation.
 
I _could_ have updated the Powershell version, but I wanted to practice my Python—so I decided to rewrite the script and solve the issues at the same time.

## Prerequisites

We're still using a Github Personal Access Token to authenticate. If you don't have one, please see the **Create a GitHub personal access token** guide in [the previous post](/local-github-repository-backup-with-powershell.html).

I'm also assuming you have a working [Python 3.8](https://www.python.org/downloads/) install. This script requires the [`requests`](https://pypi.org/project/requests/) and [`GitPython`](https://pypi.org/project/GitPython/) packages.

## Python Script

Again, the script is quite simple:

    :::python
    import os
    import sys
    import requests

    from git import Repo
    from string import Template

    # Get the command-line arguments
    user_type = sys.argv[1]
    user_id = sys.argv[2]
    github_access_token = sys.argv[3]
    url_type = sys.argv[4]
    backup_folder_path = sys.argv[5]

    # Defines a template for a GraphQL query to retrieve repositories
    query = """
    query {
        $user_type(login:"$user_id") {
            repositories(first:100,orderBy: {field: NAME, direction: ASC}$after) {
                pageInfo {
                    startCursor
                    hasNextPage
                    endCursor
                }
                nodes {
                    name
                    $url_type
                }
            }
        }
    }
    """

    query_template = Template(query)

    # Creates a new query with the specified 'after' parameter value
    def create_query(after=None):
        after_str = f',after:"{after}"' if after else ''
        return query_template.substitute(
            user_type=user_type, 
            user_id=user_id, 
            url_type=url_type, 
            after=after_str)

    # Makes the query request to the GitHub API
    def send_query(query): 
        response = requests.post(
            "https://api.github.com/graphql", 
            json={'query': query}, 
            headers={"Authorization": "Token " + github_access_token})
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f'{response.status_code}: {response.json()}')

    # Fetches one page of the results and return the data as a tuple
    def fetch_page(after=None):
        q = create_query(after)
        result = send_query(q)

        data = result['data']

        repos = data[user_type]['repositories']['nodes']
        page_info = data[user_type]['repositories']['pageInfo']

        after = page_info['endCursor']
        has_next_page = page_info['hasNextPage']

        return (has_next_page, after, repos)

    # Gets a 'friendly' short SHA hash for a commit
    def short_hash(ref):
        return ref.object.hexsha[0:8]

    after = None

    # Keep fetching pages until has_next_page is false
    while True:
        (has_next_page, new_after, repos) = fetch_page(after)

        for repo in repos:
            name = repo['name']
            url = repo[url_type]
            
            mirror_path = os.path.join(
                backup_folder_path, 
                f'{name}.git')

            msg = None

            print(name, end=': ')

            if os.path.exists(mirror_path):
                # We already have a mirror of this repo, so update it
                repo = Repo(mirror_path)
                existing_sha = short_hash(repo.head)
                repo.remotes.origin.update()
                updated_sha = short_hash(repo.head)
                if existing_sha != updated_sha:
                    msg = f"Updated [{existing_sha}->{updated_sha}]"
                else:
                    msg = f"No changes [{existing_sha}]"
            else:
                # This repo has been created since the last backup
                Repo.clone_from(url, mirror_path, multi_options=['--mirror'])
                repo = Repo(mirror_path)
                msg = f"Cloned [{short_hash(repo.head)}]"

            print(msg)

        if has_next_page:
            after = new_after
        else:
            break

    print("All repositories backed up")

[The complete script is available here](https://gist.github.com/markashleybell/6edac01b2ea15a9ae2ab8df042063277 "External Link: GitHub Python Repository Backup Gist"). The script arguments are:

    (organisation|user) <github-username> <github-access-token> (url|sshUrl) <backup-folder-path>

Specify `organisation` or `user` depending on which you are backing up repositories for. The `url`/`sshUrl` argument lets you use either HTTP or SSH to clone and update the repository backups.

So to back up my personal repositories, I can run:

    python github-mirror.py user markashleybell <MY_TOKEN> sshUrl 'C:\GitHub Backups'

I hope someone else finds this useful!
