CREATE TABLE public.int_shortener_url (
	id SERIAL,
	short_url varchar NULL,
	long_url varchar NULL,
	short_url_id varchar NULL,
	created_date date NULL,
	expired_date date NULL
);
